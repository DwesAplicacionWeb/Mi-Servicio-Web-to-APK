import React, { useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckSquare,
  ExternalLink,
  FlaskConical,
  Link2,
  Scale,
  StickyNote,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WomanIcon } from './WomanIcon';
import { SHIFT_META } from '../types/app';
import {
  formatShortBadgeDate,
  getTodayIso,
} from '../utils/dateUtils';

interface HomeViewProps {
  onOpenDayDetail: (fecha: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onOpenDayDetail }) => {
  const { state, setRoute, toggleTaskComplete } = useApp();
  const todayIso = getTodayIso();

  const todayEntry = state.calendarDays[todayIso];

  // Next upcoming shift (M, T, N, or any scheduled service from today forward)
  const nextShift = useMemo(() => {
    const upcoming = Object.values(state.calendarDays)
      .filter((d) => d.fecha >= todayIso && d.servicio !== null)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
    return upcoming[0] ?? null;
  }, [state.calendarDays, todayIso]);

  const pendingTasks = useMemo(() => {
    return state.tasks
      .filter((t) => !t.completada)
      .sort((a, b) => {
        if (a.fecha && b.fecha) return a.fecha.localeCompare(b.fecha);
        if (a.fecha) return -1;
        if (b.fecha) return 1;
        return b.prioridad - a.prioridad;
      });
  }, [state.tasks]);

  const datedUpcomingTasks = useMemo(() => {
    return pendingTasks.filter((t) => t.fecha !== null).slice(0, 4);
  }, [pendingTasks]);

  return (
    <div className="space-y-6">
      {/* Main 2-Column Operational Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Próximo turno + Tareas pendientes */}
        <div className="lg:col-span-7 space-y-6">
          {/* Próximo turno */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                Próximo turno
              </h2>
              <button
                type="button"
                onClick={() => setRoute('calendario')}
                className="min-h-[44px] inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
              >
                <span>Ver calendario</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {nextShift && nextShift.servicio ? (
              <button
                type="button"
                onClick={() => onOpenDayDetail(nextShift.fecha)}
                className="w-full flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatShortBadgeDate(nextShift.fecha)}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {SHIFT_META[nextShift.servicio].label}
                    </span>
                    {nextShift.fecha === todayIso && (
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                        (Hoy)
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                    {nextShift.observaciones || 'Pulsa para ver detalle del día o editar servicio'}
                  </p>
                </div>
                <span
                  className={`font-mono text-sm font-bold px-3 py-1.5 rounded-lg shrink-0 ${
                    SHIFT_META[nextShift.servicio].badgeClasses
                  }`}
                >
                  {nextShift.servicio}
                </span>
              </button>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-5 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No hay turnos asignados a partir de hoy.
                </p>
                <button
                  type="button"
                  onClick={() => onOpenDayDetail(todayIso)}
                  className="mt-3 min-h-[44px] inline-flex items-center justify-center px-4 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-medium"
                >
                  Asignar turno de hoy
                </button>
              </div>
            )}

            {todayEntry?.servicio && nextShift?.fecha !== todayIso && (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Hoy ({formatShortBadgeDate(todayIso)}): {SHIFT_META[todayEntry.servicio].label} ({todayEntry.servicio})
              </p>
            )}
          </section>

          {/* Tareas pendientes */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                  Tareas pendientes
                </h2>
                <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                  {pendingTasks.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRoute('tareas')}
                className="min-h-[44px] inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
              >
                <span>Ver todas</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {pendingTasks.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-3">
                Sin tareas pendientes. Todo al día.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {(datedUpcomingTasks.length > 0 ? datedUpcomingTasks : pendingTasks.slice(0, 4)).map(
                  (task) => (
                    <li key={task.id} className="py-1">
                      <button
                        type="button"
                        onClick={() => toggleTaskComplete(task.id)}
                        className="w-full min-h-[48px] flex items-center justify-between gap-3 py-2 text-left group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                              task.completada
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-300 dark:border-slate-600 group-hover:border-blue-600'
                            }`}
                          >
                            {task.completada && <Check className="h-3.5 w-3.5" />}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                              {task.titulo}
                            </p>
                            {task.fecha && (
                              <p className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                                {formatShortBadgeDate(task.fecha)}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                          {task.prioridad === 3 ? 'Alta' : task.prioridad === 2 ? 'Media' : 'Baja'}
                        </span>
                      </button>
                    </li>
                  )
                )}
              </ul>
            )}
          </section>
        </div>

        {/* Right: Módulos & Accesos rápidos */}
        <div className="lg:col-span-5 space-y-6">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Módulos de uso diario
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRoute('calendario')}
                className="min-h-[84px] flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 text-left hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <CalendarDays className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Calendario
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Turnos y estadíst.</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRoute('tareas')}
                className="min-h-[84px] flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 text-left hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <CheckSquare className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Tareas
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {pendingTasks.length} pendientes
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRoute('biblioteca')}
                className="min-h-[84px] flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 text-left hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <BookOpen className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Biblioteca
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {state.documents.length} documentos
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRoute('notas')}
                className="min-h-[84px] flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 text-left hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <StickyNote className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Notas
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {(state.notes ?? []).length} guardadas
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRoute('codificado')}
                className="min-h-[84px] flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 text-left hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <Scale className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Codificado Tráfico
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    972 infracciones DGT
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRoute('drogas')}
                className="min-h-[84px] flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 text-left hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <FlaskConical className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Calculadora Drogas
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Admin. vs Art. 368 CP
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRoute('vdg')}
                className="min-h-[84px] flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 text-left hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <WomanIcon className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    VDG / VD
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Tipos y supuestos VG/VD
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRoute('accesos')}
                className="min-h-[84px] flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 text-left hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <Link2 className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Accesos Directos
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Kelio · Nóminas · Mapa
                  </div>
                </div>
              </button>
            </div>
          </section>

          {/* Direct External Launchers */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                Accesos directos
              </h2>
              <button
                type="button"
                onClick={() => setRoute('accesos')}
                className="min-h-[40px] text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
              >
                Configurar
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.shortcuts.slice(0, 6).map((sc) => (
                <a
                  key={sc.id}
                  href={sc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[48px] flex items-center justify-between gap-3 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  <span className="truncate">{sc.nombre}</span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
