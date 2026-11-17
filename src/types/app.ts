export type ShiftCode = 'M' | 'T' | 'N' | 'V' | 'AP' | 'HEM' | 'HET' | 'HEN';

export type TaskPriority = 1 | 2 | 3; // 1 = Baja, 2 = Media, 3 = Alta

export type DocumentFormat = 'PDF' | 'DOCX' | 'TXT' | 'NOTA';

export type AppRoute =
  | 'inicio'
  | 'calendario'
  | 'tareas'
  | 'notas'
  | 'biblioteca'
  | 'codificado'
  | 'drogas'
  | 'vdg'
  | 'accesos'
  | 'configuracion';

export type CodificadoNorm = 'CIR' | 'VEH' | 'CON' | 'SDA' | 'SOA' | 'LSV' | 'EPC' | 'CRC';

export type CodificadoGravedad = 'Muy grave' | 'Grave' | 'Leve' | 'Aseguramiento';

export interface CodificadoInfraction {
  id: string;
  norma: CodificadoNorm;
  codigo: string;
  art: string;
  apt: string;
  opc: string;
  gravedad: CodificadoGravedad;
  importe: string;
  reduccion: string;
  puntos: number;
  puntosTexto: string;
  hecho: string;
  observaciones: string;
  comentario: string;
  responsable: string;
  materia: string;
}

export interface UserProfile {
  id: string;
  nombre: string;
  fecha_creacion: string;
}

export interface CalendarDay {
  id: string;
  fecha: string; // YYYY-MM-DD
  servicio: ShiftCode | null;
  observaciones: string;
}

export interface AnnualSummary {
  id: string;
  año: number;
  vacaciones_totales: number;
  vacaciones_ajuste: number; // ajuste manual (+/-) sobre (totales - días V marcados)
  ap_totales: number;
  ap_ajuste: number; // ajuste manual (+/-) sobre (totales - días AP marcados)
}

export interface HourMovement {
  id: string;
  fecha: string; // ISO string
  deltaMinutos: number;
  motivo: string;
}

export interface TaskItem {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string | null; // YYYY-MM-DD
  prioridad: TaskPriority;
  completada: boolean;
  fecha_creacion: string;
}

export interface NoteItem {
  id: string;
  titulo: string;
  contenido: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface CategoryItem {
  id: string;
  nombre: string;
  tipo: 'principal';
  subcategorias: string[];
}

export interface DocumentItem {
  id: string;
  titulo: string;
  categoria: string;
  subcategoria: string;
  formato: DocumentFormat;
  ruta_archivo: string;
  contenido_texto: string;
  tamano_bytes?: number;
  tiene_blob?: boolean;
  fecha_importacion: string;
  favorito: boolean;
}

export interface ShortcutItem {
  id: string;
  nombre: string;
  descripcion: string;
  url: string;
  icono: string; // lucide icon key
}

export interface AppSettings {
  tema: 'light' | 'dark';
  anoTrabajo: number;
  pinActivo: boolean;
  pinCodigo: string;
}

export interface AppState {
  user: UserProfile;
  calendarDays: Record<string, CalendarDay>; // key = YYYY-MM-DD
  annualSummaries: Record<number, AnnualSummary>; // key = año
  saldoHorasMinutos: number; // acumulativo, no se reinicia por año
  hourMovements: HourMovement[];
  tasks: TaskItem[];
  notes: NoteItem[];
  categories: CategoryItem[];
  documents: DocumentItem[];
  shortcuts: ShortcutItem[];
  codificadoFavorites: string[];
  codificadoNotes: Record<string, string>;
  settings: AppSettings;
}

export const SHIFT_META: Record<
  ShiftCode,
  {
    code: ShiftCode;
    label: string;
    shortLabel: string;
    cellClasses: string;
    badgeClasses: string;
    dotColor: string;
  }
> = {
  M: {
    code: 'M',
    label: 'Mañana',
    shortLabel: 'Mañ.',
    cellClasses:
      'bg-sky-50 text-sky-900 border-sky-200 dark:bg-sky-950/55 dark:text-sky-100 dark:border-sky-800/70',
    badgeClasses:
      'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950',
    dotColor: 'bg-sky-600 dark:bg-sky-400',
  },
  T: {
    code: 'T',
    label: 'Tarde',
    shortLabel: 'Tar.',
    cellClasses:
      'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/55 dark:text-amber-100 dark:border-amber-800/70',
    badgeClasses:
      'bg-amber-600 text-white dark:bg-amber-500 dark:text-slate-950',
    dotColor: 'bg-amber-600 dark:bg-amber-400',
  },
  N: {
    code: 'N',
    label: 'Noche',
    shortLabel: 'Noc.',
    cellClasses:
      'bg-indigo-50 text-indigo-900 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-100 dark:border-indigo-800/70',
    badgeClasses:
      'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white',
    dotColor: 'bg-indigo-600 dark:bg-indigo-400',
  },
  V: {
    code: 'V',
    label: 'Vacaciones',
    shortLabel: 'Vac.',
    cellClasses:
      'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/55 dark:text-emerald-100 dark:border-emerald-800/70',
    badgeClasses:
      'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950',
    dotColor: 'bg-emerald-600 dark:bg-emerald-400',
  },
  AP: {
    code: 'AP',
    label: 'Asuntos Propios',
    shortLabel: 'AP',
    cellClasses:
      'bg-violet-50 text-violet-900 border-violet-200 dark:bg-violet-950/55 dark:text-violet-100 dark:border-violet-800/70',
    badgeClasses:
      'bg-violet-600 text-white dark:bg-violet-500 dark:text-white',
    dotColor: 'bg-violet-600 dark:bg-violet-400',
  },
  HEM: {
    code: 'HEM',
    label: 'Horas extra mañana',
    shortLabel: 'HE Mañ.',
    cellClasses:
      'bg-cyan-50 text-cyan-900 border-cyan-200 dark:bg-cyan-950/55 dark:text-cyan-100 dark:border-cyan-800/70',
    badgeClasses:
      'bg-cyan-600 text-white dark:bg-cyan-500 dark:text-slate-950',
    dotColor: 'bg-cyan-600 dark:bg-cyan-400',
  },
  HET: {
    code: 'HET',
    label: 'Horas extra tarde',
    shortLabel: 'HE Tar.',
    cellClasses:
      'bg-orange-50 text-orange-900 border-orange-200 dark:bg-orange-950/55 dark:text-orange-100 dark:border-orange-800/70',
    badgeClasses:
      'bg-orange-600 text-white dark:bg-orange-500 dark:text-slate-950',
    dotColor: 'bg-orange-600 dark:bg-orange-400',
  },
  HEN: {
    code: 'HEN',
    label: 'Horas extra noche',
    shortLabel: 'HE Noc.',
    cellClasses:
      'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/55 dark:text-rose-100 dark:border-rose-800/70',
    badgeClasses:
      'bg-rose-600 text-white dark:bg-rose-500 dark:text-white',
    dotColor: 'bg-rose-600 dark:bg-rose-400',
  },
};
