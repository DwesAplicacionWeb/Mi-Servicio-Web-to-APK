import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { buildSeedState } from '../data/seedData';
import {
  AnnualSummary,
  AppRoute,
  AppSettings,
  AppState,
  CalendarDay,
  CategoryItem,
  DocumentItem,
  NoteItem,
  ShiftCode,
  ShortcutItem,
  TaskItem,
  TaskPriority,
} from '../types/app';
import { getTodayIso } from '../utils/dateUtils';
import { deleteDocumentBlob, saveDocumentBlob } from '../utils/fileStorage';

const STORAGE_KEY = 'mi_servicio_app_state_v1';

export interface ShiftStats {
  M: number;
  T: number;
  N: number;
  V: number;
  AP: number;
  HEM: number;
  HET: number;
  HEN: number;
  totalServicios: number;
  totalHorasExtra: number;
}

export interface ComputedAnnualBalance {
  año: number;
  vacacionesTotales: number;
  vacacionesUsadas: number;
  vacacionesDisponibles: number;
  apTotales: number;
  apUsados: number;
  apDisponibles: number;
}

interface ToastMessage {
  id: string;
  text: string;
  tone?: 'info' | 'success' | 'error';
}

interface AppContextValue {
  state: AppState;
  route: AppRoute;
  setRoute: (route: AppRoute) => void;
  isLocked: boolean;
  unlockWithPin: (pin: string) => boolean;
  lockApp: () => void;
  toasts: ToastMessage[];
  showToast: (text: string, tone?: ToastMessage['tone']) => void;

  // Calendar & Annual Summary
  ensureYearExists: (year: number) => void;
  setWorkingYear: (year: number) => void;
  availableYears: number[];
  getAnnualBalance: (year: number) => ComputedAnnualBalance;
  getYearStats: (year: number) => ShiftStats;
  getMonthStats: (year: number, monthIndex: number) => ShiftStats;
  setDayEntry: (fecha: string, servicio: ShiftCode | null, observaciones?: string) => void;
  updateManualAnnualQuotas: (
    year: number,
    updates: {
      vacacionesDisponibles?: number;
      vacacionesTotales?: number;
      apDisponibles?: number;
      apTotales?: number;
    }
  ) => void;

  // Hours balance
  adjustHoursBalance: (deltaMinutos: number, motivo: string) => void;
  setExactHoursBalance: (totalMinutos: number, motivo: string) => void;
  clearHourMovements: () => void;

  // Tasks
  addTask: (input: {
    titulo: string;
    descripcion: string;
    fecha: string | null;
    prioridad: TaskPriority;
  }) => void;
  updateTask: (
    id: string,
    updates: Partial<Pick<TaskItem, 'titulo' | 'descripcion' | 'fecha' | 'prioridad' | 'completada'>>
  ) => void;
  toggleTaskComplete: (id: string) => void;
  deleteTask: (id: string) => void;

  // Notes
  addNote: (input: { titulo: string; contenido: string }) => NoteItem;
  updateNote: (id: string, updates: { titulo: string; contenido: string }) => void;
  deleteNote: (id: string) => void;

  // Library & Categories
  addCategory: (nombre: string, subcategorias?: string[]) => void;
  addSubcategory: (categoryId: string, subcategoryName: string) => void;
  addDocument: (
    doc: Omit<DocumentItem, 'id' | 'fecha_importacion'>,
    blobData?: { mimeType: string; dataUrl: string }
  ) => Promise<DocumentItem>;
  toggleDocumentFavorite: (id: string) => void;
  deleteDocument: (id: string) => Promise<void>;

  // Shortcuts
  addShortcut: (input: Omit<ShortcutItem, 'id'>) => void;
  updateShortcut: (id: string, updates: Omit<ShortcutItem, 'id'>) => void;
  deleteShortcut: (id: string) => void;

  // Codificado Tráfico (personal favorites & local notes)
  toggleCodificadoFavorite: (id: string) => void;
  setCodificadoNote: (id: string, note: string) => void;

  // Settings & Backups
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateUserName: (nombre: string) => void;
  exportBackupJson: () => string;
  importBackupJson: (jsonText: string) => { ok: boolean; error?: string };
  resetAllData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function createDefaultYearSummary(year: number): AnnualSummary {
  return {
    id: `summary-${year}`,
    año: year,
    vacaciones_totales: 27,
    vacaciones_ajuste: 0,
    ap_totales: 3,
    ap_ajuste: 0,
  };
}

function loadInitialState(): AppState {
  const realCurrentYear = new Date().getFullYear();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      // RF-002 & RF-003: Automatic reset/creation every Jan 1st when entering a new calendar year
      const summaries = { ...(parsed.annualSummaries || {}) };
      if (!summaries[realCurrentYear]) {
        summaries[realCurrentYear] = createDefaultYearSummary(realCurrentYear);
      }
      const urlMigrations: Record<string, string> = {
        'https://www.kelio.com': 'https://fichajes.valledeegues.com:20443/open/login',
        'https://sede.navarra.es': 'https://empleado.pyramide.es',
        'https://www.navarra.es': 'https://riacna.es/',
      };
      const rawShortcuts = Array.isArray(parsed.shortcuts)
        ? parsed.shortcuts.map((sc) => ({
            ...sc,
            url: urlMigrations[sc.url] ?? sc.url,
          }))
        : buildSeedState().shortcuts;
      const hasMapa = rawShortcuts.some(
        (sc) => sc.id === 'sc-mapa' || sc.url.includes('idena.navarra.es')
      );
      const mapaSeed = buildSeedState().shortcuts.find((sc) => sc.id === 'sc-mapa');
      const migratedShortcuts = !hasMapa && mapaSeed ? [...rawShortcuts, mapaSeed] : rawShortcuts;
      const cleanedCalendarDays: Record<string, CalendarDay> = {};
      if (parsed.calendarDays && typeof parsed.calendarDays === 'object') {
        for (const [k, day] of Object.entries(parsed.calendarDays)) {
          const code = day?.servicio as string | null;
          cleanedCalendarDays[k] = {
            ...day,
            servicio: code === 'F' ? null : (day.servicio ?? null),
          };
        }
      }
      const categoryMigrations: Record<string, string> = {
        Legislación: 'Leyes',
        Formularios: 'Esquemas',
      };
      const defaultOrder = ['Ordenanzas', 'Leyes', 'Protocolos', 'Esquemas'];
      const migratedCategories = Array.isArray(parsed.categories)
        ? parsed.categories
            .map((c) => ({
              ...c,
              nombre: categoryMigrations[c.nombre] ?? c.nombre,
            }))
            .sort((a, b) => {
              const ia = defaultOrder.indexOf(a.nombre);
              const ib = defaultOrder.indexOf(b.nombre);
              if (ia !== -1 && ib !== -1) return ia - ib;
              if (ia !== -1) return -1;
              if (ib !== -1) return 1;
              return 0;
            })
        : buildSeedState().categories;
      const migratedDocuments = Array.isArray(parsed.documents)
        ? parsed.documents.map((doc) => ({
            ...doc,
            categoria: categoryMigrations[doc.categoria] ?? doc.categoria,
          }))
        : buildSeedState().documents;
      return {
        ...buildSeedState(),
        ...parsed,
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
        categories: migratedCategories,
        documents: migratedDocuments,
        calendarDays: cleanedCalendarDays,
        shortcuts: migratedShortcuts,
        codificadoFavorites: Array.isArray(parsed.codificadoFavorites)
          ? parsed.codificadoFavorites
          : [],
        codificadoNotes:
          parsed.codificadoNotes && typeof parsed.codificadoNotes === 'object'
            ? parsed.codificadoNotes
            : {},
        annualSummaries: summaries,
        settings: {
          ...buildSeedState().settings,
          ...(parsed.settings || {}),
        },
      };
    }
  } catch {
    // fallback to seed
  }
  const seed = buildSeedState();
  if (!seed.annualSummaries[realCurrentYear]) {
    seed.annualSummaries[realCurrentYear] = createDefaultYearSummary(realCurrentYear);
  }
  return seed;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(loadInitialState);
  const [route, setRoute] = useState<AppRoute>('inicio');
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const initial = loadInitialState();
    return Boolean(initial.settings.pinActivo);
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, tone: ToastMessage['tone'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { id, text, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota errors on metadata
    }
  }, [state]);

  // Sync Tailwind dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.tema === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.settings.tema]);

  const ensureYearExists = useCallback((year: number) => {
    setState((prev) => {
      if (prev.annualSummaries[year]) return prev;
      return {
        ...prev,
        annualSummaries: {
          ...prev.annualSummaries,
          [year]: createDefaultYearSummary(year),
        },
      };
    });
  }, []);

  const setWorkingYear = useCallback((year: number) => {
    setState((prev) => {
      const summaries = prev.annualSummaries[year]
        ? prev.annualSummaries
        : { ...prev.annualSummaries, [year]: createDefaultYearSummary(year) };
      return {
        ...prev,
        annualSummaries: summaries,
        settings: {
          ...prev.settings,
          anoTrabajo: year,
        },
      };
    });
  }, []);

  const availableYears = useMemo(() => {
    const set = new Set<number>([
      new Date().getFullYear(),
      state.settings.anoTrabajo,
      ...Object.keys(state.annualSummaries).map(Number),
    ]);
    Object.values(state.calendarDays).forEach((d) => {
      const yr = Number(d.fecha.slice(0, 4));
      if (!Number.isNaN(yr)) set.add(yr);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [state.annualSummaries, state.calendarDays, state.settings.anoTrabajo]);

  const computeStatsForDays = useCallback((days: CalendarDay[]): ShiftStats => {
    const stats: ShiftStats = {
      M: 0,
      T: 0,
      N: 0,
      V: 0,
      AP: 0,
      HEM: 0,
      HET: 0,
      HEN: 0,
      totalServicios: 0,
      totalHorasExtra: 0,
    };
    for (const d of days) {
      if (!d.servicio) continue;
      if (d.servicio in stats) {
        stats[d.servicio] += 1;
      }
      if (d.servicio === 'M' || d.servicio === 'T' || d.servicio === 'N') {
        stats.totalServicios += 1;
      }
      if (d.servicio === 'HEM' || d.servicio === 'HET' || d.servicio === 'HEN') {
        stats.totalHorasExtra += 1;
      }
    }
    return stats;
  }, []);

  const getYearStats = useCallback(
    (year: number): ShiftStats => {
      const prefix = `${year}-`;
      const days = Object.values(state.calendarDays).filter((d) => d.fecha.startsWith(prefix));
      return computeStatsForDays(days);
    },
    [state.calendarDays, computeStatsForDays]
  );

  const getMonthStats = useCallback(
    (year: number, monthIndex: number): ShiftStats => {
      const prefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}-`;
      const days = Object.values(state.calendarDays).filter((d) => d.fecha.startsWith(prefix));
      return computeStatsForDays(days);
    },
    [state.calendarDays, computeStatsForDays]
  );

  const getAnnualBalance = useCallback(
    (year: number): ComputedAnnualBalance => {
      const summary = state.annualSummaries[year] ?? createDefaultYearSummary(year);
      const stats = getYearStats(year);
      const vacacionesDisponibles = Math.max(
        0,
        summary.vacaciones_totales - stats.V + summary.vacaciones_ajuste
      );
      const apDisponibles = Math.max(0, summary.ap_totales - stats.AP + summary.ap_ajuste);

      return {
        año: year,
        vacacionesTotales: summary.vacaciones_totales,
        vacacionesUsadas: stats.V,
        vacacionesDisponibles,
        apTotales: summary.ap_totales,
        apUsados: stats.AP,
        apDisponibles,
      };
    },
    [state.annualSummaries, getYearStats]
  );

  const setDayEntry = useCallback(
    (fecha: string, servicio: ShiftCode | null, observaciones?: string) => {
      const year = Number(fecha.slice(0, 4));
      setState((prev) => {
        const summaries = prev.annualSummaries[year]
          ? prev.annualSummaries
          : { ...prev.annualSummaries, [year]: createDefaultYearSummary(year) };

        const existing = prev.calendarDays[fecha];
        const nextObs = observaciones !== undefined ? observaciones : existing?.observaciones ?? '';
        const nextCalendarDays = { ...prev.calendarDays };

        if (servicio === null && nextObs.trim() === '') {
          delete nextCalendarDays[fecha];
        } else {
          nextCalendarDays[fecha] = {
            id: existing?.id ?? `day-${fecha}`,
            fecha,
            servicio,
            observaciones: nextObs,
          };
        }

        return {
          ...prev,
          annualSummaries: summaries,
          calendarDays: nextCalendarDays,
        };
      });
    },
    []
  );

  const updateManualAnnualQuotas = useCallback(
    (
      year: number,
      updates: {
        vacacionesDisponibles?: number;
        vacacionesTotales?: number;
        apDisponibles?: number;
        apTotales?: number;
      }
    ) => {
      setState((prev) => {
        const currentSummary = prev.annualSummaries[year] ?? createDefaultYearSummary(year);
        const prefix = `${year}-`;
        const days = Object.values(prev.calendarDays).filter((d) => d.fecha.startsWith(prefix));
        const usedV = days.filter((d) => d.servicio === 'V').length;
        const usedAP = days.filter((d) => d.servicio === 'AP').length;

        const nextVacTotales =
          updates.vacacionesTotales !== undefined
            ? Math.max(0, updates.vacacionesTotales)
            : currentSummary.vacaciones_totales;
        const nextApTotales =
          updates.apTotales !== undefined
            ? Math.max(0, updates.apTotales)
            : currentSummary.ap_totales;

        const nextVacAjuste =
          updates.vacacionesDisponibles !== undefined
            ? Math.max(0, updates.vacacionesDisponibles) - (nextVacTotales - usedV)
            : currentSummary.vacaciones_ajuste;

        const nextApAjuste =
          updates.apDisponibles !== undefined
            ? Math.max(0, updates.apDisponibles) - (nextApTotales - usedAP)
            : currentSummary.ap_ajuste;

        return {
          ...prev,
          annualSummaries: {
            ...prev.annualSummaries,
            [year]: {
              ...currentSummary,
              vacaciones_totales: nextVacTotales,
              vacaciones_ajuste: nextVacAjuste,
              ap_totales: nextApTotales,
              ap_ajuste: nextApAjuste,
            },
          },
        };
      });
    },
    []
  );

  const adjustHoursBalance = useCallback((deltaMinutos: number, motivo: string) => {
    if (deltaMinutos === 0) return;
    setState((prev) => ({
      ...prev,
      saldoHorasMinutos: prev.saldoHorasMinutos + deltaMinutos,
      hourMovements: [
        {
          id: `hm-${Date.now()}`,
          fecha: getTodayIso(),
          deltaMinutos,
          motivo: motivo.trim() || (deltaMinutos > 0 ? 'Incremento manual' : 'Reducción manual'),
        },
        ...prev.hourMovements,
      ].slice(0, 40),
    }));
  }, []);

  const setExactHoursBalance = useCallback((totalMinutos: number, motivo: string) => {
    setState((prev) => {
      const delta = totalMinutos - prev.saldoHorasMinutos;
      return {
        ...prev,
        saldoHorasMinutos: totalMinutos,
        hourMovements: [
          {
            id: `hm-${Date.now()}`,
            fecha: getTodayIso(),
            deltaMinutos: delta,
            motivo: motivo.trim() || 'Ajuste directo de saldo',
          },
          ...prev.hourMovements,
        ].slice(0, 40),
      };
    });
  }, []);

  const clearHourMovements = useCallback(() => {
    setState((prev) => ({ ...prev, hourMovements: [] }));
  }, []);

  const addTask = useCallback(
    (input: { titulo: string; descripcion: string; fecha: string | null; prioridad: TaskPriority }) => {
      const newTask: TaskItem = {
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        titulo: input.titulo.trim(),
        descripcion: input.descripcion.trim(),
        fecha: input.fecha || null,
        prioridad: input.prioridad,
        completada: false,
        fecha_creacion: getTodayIso(),
      };
      setState((prev) => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
    },
    []
  );

  const updateTask = useCallback(
    (
      id: string,
      updates: Partial<Pick<TaskItem, 'titulo' | 'descripcion' | 'fecha' | 'prioridad' | 'completada'>>
    ) => {
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
    },
    []
  );

  const toggleTaskComplete = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, completada: !t.completada } : t)),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  }, []);

  const addNote = useCallback((input: { titulo: string; contenido: string }): NoteItem => {
    const today = getTodayIso();
    const firstLine = input.contenido.trim().split('\n')[0]?.slice(0, 48) || 'Nota personal';
    const newNote: NoteItem = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      titulo: input.titulo.trim() || firstLine,
      contenido: input.contenido.trim(),
      fecha_creacion: today,
      fecha_actualizacion: today,
    };
    setState((prev) => ({
      ...prev,
      notes: [newNote, ...(prev.notes ?? [])],
    }));
    return newNote;
  }, []);

  const updateNote = useCallback((id: string, updates: { titulo: string; contenido: string }) => {
    const today = getTodayIso();
    const firstLine = updates.contenido.trim().split('\n')[0]?.slice(0, 48) || 'Nota personal';
    setState((prev) => ({
      ...prev,
      notes: (prev.notes ?? []).map((n) =>
        n.id === id
          ? {
              ...n,
              titulo: updates.titulo.trim() || firstLine,
              contenido: updates.contenido.trim(),
              fecha_actualizacion: today,
            }
          : n
      ),
    }));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notes: (prev.notes ?? []).filter((n) => n.id !== id),
    }));
  }, []);

  const addCategory = useCallback((nombre: string, subcategorias: string[] = []) => {
    const cleanName = nombre.trim();
    if (!cleanName) return;
    setState((prev) => {
      if (prev.categories.some((c) => c.nombre.toLowerCase() === cleanName.toLowerCase())) {
        return prev;
      }
      const nextCat: CategoryItem = {
        id: `cat-${Date.now()}`,
        nombre: cleanName,
        tipo: 'principal',
        subcategorias,
      };
      return { ...prev, categories: [...prev.categories, nextCat] };
    });
  }, []);

  const addSubcategory = useCallback((categoryId: string, subcategoryName: string) => {
    const clean = subcategoryName.trim();
    if (!clean) return;
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === categoryId && !c.subcategorias.includes(clean)
          ? { ...c, subcategorias: [...c.subcategorias, clean] }
          : c
      ),
    }));
  }, []);

  const addDocument = useCallback(
    async (
      doc: Omit<DocumentItem, 'id' | 'fecha_importacion'>,
      blobData?: { mimeType: string; dataUrl: string }
    ): Promise<DocumentItem> => {
      const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      let tieneBlob = false;
      if (blobData) {
        try {
          await saveDocumentBlob(id, blobData.mimeType, blobData.dataUrl);
          tieneBlob = true;
        } catch {
          tieneBlob = false;
        }
      }
      const newDoc: DocumentItem = {
        ...doc,
        id,
        tiene_blob: tieneBlob,
        fecha_importacion: getTodayIso(),
      };
      setState((prev) => ({
        ...prev,
        documents: [newDoc, ...prev.documents],
      }));
      return newDoc;
    },
    []
  );

  const toggleDocumentFavorite = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      documents: prev.documents.map((d) => (d.id === id ? { ...d, favorito: !d.favorito } : d)),
    }));
  }, []);

  const deleteDocument = useCallback(async (id: string) => {
    await deleteDocumentBlob(id);
    setState((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.id !== id),
    }));
  }, []);

  const addShortcut = useCallback((input: Omit<ShortcutItem, 'id'>) => {
    const item: ShortcutItem = {
      ...input,
      id: `sc-${Date.now()}`,
    };
    setState((prev) => ({ ...prev, shortcuts: [...prev.shortcuts, item] }));
  }, []);

  const updateShortcut = useCallback((id: string, updates: Omit<ShortcutItem, 'id'>) => {
    setState((prev) => ({
      ...prev,
      shortcuts: prev.shortcuts.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  }, []);

  const deleteShortcut = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      shortcuts: prev.shortcuts.filter((s) => s.id !== id),
    }));
  }, []);

  const toggleCodificadoFavorite = useCallback((id: string) => {
    setState((prev) => {
      const current = prev.codificadoFavorites ?? [];
      const exists = current.includes(id);
      return {
        ...prev,
        codificadoFavorites: exists ? current.filter((item) => item !== id) : [...current, id],
      };
    });
  }, []);

  const setCodificadoNote = useCallback((id: string, note: string) => {
    setState((prev) => {
      const nextNotes = { ...(prev.codificadoNotes ?? {}) };
      if (note === '') {
        delete nextNotes[id];
      } else {
        nextNotes[id] = note;
      }
      return {
        ...prev,
        codificadoNotes: nextNotes,
      };
    });
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
  }, []);

  const updateUserName = useCallback((nombre: string) => {
    setState((prev) => ({
      ...prev,
      user: { ...prev.user, nombre: nombre.trim() || 'Agente' },
    }));
  }, []);

  const unlockWithPin = useCallback(
    (pin: string) => {
      if (pin === state.settings.pinCodigo) {
        setIsLocked(false);
        return true;
      }
      return false;
    },
    [state.settings.pinCodigo]
  );

  const lockApp = useCallback(() => {
    if (state.settings.pinActivo) {
      setIsLocked(true);
    }
  }, [state.settings.pinActivo]);

  const exportBackupJson = useCallback(() => {
    return JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data: state,
      },
      null,
      2
    );
  }, [state]);

  const importBackupJson = useCallback((jsonText: string): { ok: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonText);
      const payload = (parsed?.data ?? parsed) as Partial<AppState>;
      if (!payload || typeof payload !== 'object' || !payload.calendarDays || !payload.tasks) {
        return { ok: false, error: 'El archivo no tiene el formato válido de Mi Servicio.' };
      }
      const seed = buildSeedState();
      setState({
        ...seed,
        ...payload,
        codificadoFavorites: Array.isArray(payload.codificadoFavorites)
          ? payload.codificadoFavorites
          : [],
        codificadoNotes:
          payload.codificadoNotes && typeof payload.codificadoNotes === 'object'
            ? payload.codificadoNotes
            : {},
        settings: {
          ...seed.settings,
          ...(payload.settings || {}),
        },
      });
      return { ok: true };
    } catch {
      return { ok: false, error: 'No se pudo leer el archivo JSON de copia de seguridad.' };
    }
  }, []);

  const resetAllData = useCallback(() => {
    const fresh = buildSeedState();
    setState(fresh);
    setIsLocked(false);
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        route,
        setRoute,
        isLocked,
        unlockWithPin,
        lockApp,
        toasts,
        showToast,
        ensureYearExists,
        setWorkingYear,
        availableYears,
        getAnnualBalance,
        getYearStats,
        getMonthStats,
        setDayEntry,
        updateManualAnnualQuotas,
        adjustHoursBalance,
        setExactHoursBalance,
        clearHourMovements,
        addTask,
        updateTask,
        toggleTaskComplete,
        deleteTask,
        addNote,
        updateNote,
        deleteNote,
        addCategory,
        addSubcategory,
        addDocument,
        toggleDocumentFavorite,
        deleteDocument,
        addShortcut,
        updateShortcut,
        deleteShortcut,
        toggleCodificadoFavorite,
        setCodificadoNote,
        updateSettings,
        updateUserName,
        exportBackupJson,
        importBackupJson,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp debe utilizarse dentro de AppProvider');
  }
  return ctx;
}
