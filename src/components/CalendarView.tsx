import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eraser, Plus, SlidersHorizontal, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SHIFT_META, ShiftCode } from '../types/app';
import {
  DIAS_SEMANA_CORTOS,
  formatHoursBalance,
  getMonthGridDays,
  getTodayIso,
  MESES_ES,
} from '../utils/dateUtils';

interface CalendarViewProps {
  onOpenDayDetail: (fecha: string) => void;
  onOpenHoursModal: () => void;
}

const SHIFT_CODES: ShiftCode[] = ['M', 'T', 'N', 'V', 'AP', 'HEM', 'HET', 'HEN'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  onOpenDayDetail,
  onOpenHoursModal,
}) => {
  const {
    state,
    availableYears,
    setWorkingYear,
    ensureYearExists,
    setDayEntry,
    getYearStats,
    getMonthStats,
    getAnnualBalance,
    updateManualAnnualQuotas,
    showToast,
  } = useApp();

  const todayIso = getTodayIso();
  const [viewYear, setViewYear] = useState<number>(state.settings.anoTrabajo);
  const [viewMonth, setViewMonth] = useState<number>(() => new Date().getMonth());
  const [quickPaint, setQuickPaint] = useState<ShiftCode | 'ERASE' | null>(null);
  const [statsScope, setStatsScope] = useState<'year' | 'month'>('year');
  const [quotasModalOpen, setQuotasModalOpen] = useState(false);
  const [vacDispInput, setVacDispInput] = useState('');
  const [vacTotInput, setVacTotInput] = useState('');
  const [apDispInput, setApDispInput] = useState('');
  const [apTotInput, setApTotInput] = useState('');

  const gridDays = useMemo(() => getMonthGridDays(viewYear, viewMonth), [viewYear, viewMonth]);

  // Index tasks by date for fast O(1) dot indicators
  const tasksCountByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of state.tasks) {
      if (t.fecha) {
        map[t.fecha] = (map[t.fecha] ?? 0) + 1;
      }
    }
    return map;
  }, [state.tasks]);

  const yearStats = getYearStats(viewYear);
  const monthStats = getMonthStats(viewYear, viewMonth);
  const activeStats = statsScope === 'year' ? yearStats : monthStats;
  const annualBalance = getAnnualBalance(viewYear);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      const nextYear = viewYear - 1;
      ensureYearExists(nextYear);
      setViewYear(nextYear);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      const nextYear = viewYear + 1;
      ensureYearExists(nextYear);
      setViewYear(nextYear);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    ensureYearExists(y);
    setViewYear(y);
    setViewMonth(now.getMonth());
  };

  const handleAddNextYear = () => {
    const maxYear = Math.max(...availableYears, viewYear);
    const nextYear = maxYear + 1;
    setWorkingYear(nextYear);
    setViewYear(nextYear);
    setViewMonth(0);
    showToast(`Año ${nextYear} creado (27 Vacaciones · 3 AP)`, 'success');
  };

  const handleDayClick = (iso: string) => {
    if (quickPaint === null) {
      onOpenDayDetail(iso);
      return;
    }
    if (quickPaint === 'ERASE') {
      setDayEntry(iso, null);
      return;
    }
    const existing = state.calendarDays[iso]?.servicio ?? null;
    setDayEntry(iso, existing === quickPaint ? null : quickPaint);
  };

  const isNegativeBalance = state.saldoHorasMinutos < 0;

  const openQuotasModal = () => {
    setVacDispInput(String(annualBalance.vacacionesDisponibles));
    setVacTotInput(String(annualBalance.vacacionesTotales));
    setApDispInput(String(annualBalance.apDisponibles));
    setApTotInput(String(annualBalance.apTotales));
    setQuotasModalOpen(true);
  };

  const handleSaveQuotas = (e: React.FormEvent) => {
    e.preventDefault();
    updateManualAnnualQuotas(viewYear, {
      vacacionesDisponibles: Math.max(0, parseInt(vacDispInput || '0', 10) || 0),
      vacacionesTotales: Math.max(0, parseInt(vacTotInput || '27', 10) || 0),
      apDisponibles: Math.max(0, parseInt(apDispInput || '0', 10) || 0),
      apTotales: Math.max(0, parseInt(apTotInput || '3', 10) || 0),
    });
    setQuotasModalOpen(false);
    showToast(`Cupos de ${viewYear} actualizados`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Vacaciones, Asuntos Propios & Saldo de Horas */}
      <section aria-label="Resumen de cupos y saldo horario" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Vacaciones ({viewYear})
            </span>
            <button
              type="button"
              onClick={openQuotasModal}
              className="min-h-[36px] inline-flex items-center gap-1 px-2 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Editar</span>
            </button>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {annualBalance.vacacionesDisponibles}
            </span>
            <span className="font-mono text-sm text-slate-400 dark:text-slate-500 tabular-nums">
              / {annualBalance.vacacionesTotales}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {annualBalance.vacacionesUsadas} disfrutados
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Asuntos propios ({viewYear})
            </span>
            <button
              type="button"
              onClick={openQuotasModal}
              className="min-h-[36px] inline-flex items-center gap-1 px-2 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Editar</span>
            </button>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold text-violet-700 dark:text-violet-400 tabular-nums">
              {annualBalance.apDisponibles}
            </span>
            <span className="font-mono text-sm text-slate-400 dark:text-slate-500 tabular-nums">
              / {annualBalance.apTotales}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {annualBalance.apUsados} marcados
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenHoursModal}
          className="text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
        >
          <div className="flex items-center justify-between gap-2 w-full">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Saldo de horas
            </span>
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 group-hover:underline">
              Modificar
            </span>
          </div>
          <div
            className={`mt-1.5 font-mono text-2xl font-bold tabular-nums ${
              isNegativeBalance
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {formatHoursBalance(state.saldoHorasMinutos)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Acumulativo continuo · Sin reinicio
          </p>
        </button>
      </section>

      {/* Month & Year Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:px-6">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Mes anterior"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <h2 className="font-display text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 min-w-[168px] text-center tabular-nums">
            {MESES_ES[viewMonth]} {viewYear}
          </h2>

          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Mes siguiente"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={handleGoToday}
            className="min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 transition-colors"
          >
            Hoy
          </button>

          <select
            aria-label="Seleccionar año"
            value={viewYear}
            onChange={(e) => {
              const yr = Number(e.target.value);
              setWorkingYear(yr);
              setViewYear(yr);
            }}
            className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-semibold font-mono text-slate-800 dark:text-slate-200 shrink-0 focus:outline-none focus:border-blue-600"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleAddNextYear}
            className="min-h-[44px] inline-flex items-center gap-1 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nuevo año</span>
          </button>
        </div>
      </div>

      {/* Quick Assignment Mode Toolbar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {quickPaint === null
                ? 'Modo consulta: pulsa un día para ver su detalle y tareas'
                : quickPaint === 'ERASE'
                  ? 'Modo borrador activo: pulsa días para limpiar turno'
                  : `Asignación rápida (${SHIFT_META[quickPaint].label}): pulsa días para marcar`}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setQuickPaint(null)}
              className={`min-h-[40px] px-3 rounded-xl text-xs font-semibold border transition-colors ${
                quickPaint === null
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Detalle
            </button>

            {SHIFT_CODES.map((code) => {
              const active = quickPaint === code;
              const meta = SHIFT_META[code];
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setQuickPaint(active ? null : code)}
                  title={meta.label}
                  className={`min-h-[40px] min-w-[40px] px-2.5 rounded-xl font-mono text-xs font-bold border transition-all ${
                    active
                      ? `${meta.badgeClasses} border-transparent ring-2 ring-blue-600 dark:ring-blue-400`
                      : `${meta.cellClasses} hover:opacity-90`
                  }`}
                >
                  {code}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setQuickPaint(quickPaint === 'ERASE' ? null : 'ERASE')}
              aria-label="Modo borrar turno"
              title="Limpiar día"
              className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border transition-colors ${
                quickPaint === 'ERASE'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Eraser className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Grid */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-5">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
          {DIAS_SEMANA_CORTOS.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 py-1.5"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {gridDays.map((cell) => {
            const entry = state.calendarDays[cell.iso];
            const shift = entry?.servicio ?? null;
            const shiftMeta = shift ? SHIFT_META[shift] : null;
            const taskCount = tasksCountByDate[cell.iso] ?? 0;
            const isToday = cell.iso === todayIso;

            return (
              <button
                key={cell.iso}
                type="button"
                onClick={() => handleDayClick(cell.iso)}
                className={`relative min-h-[58px] sm:min-h-[76px] flex flex-col justify-between rounded-xl border p-1.5 sm:p-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${
                  shiftMeta
                    ? shiftMeta.cellClasses
                    : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                } ${!cell.inCurrentMonth ? 'opacity-40' : ''} ${
                  isToday ? 'ring-2 ring-blue-600 dark:ring-blue-400' : ''
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <span
                    className={`font-mono text-xs sm:text-sm font-semibold tabular-nums leading-none ${
                      isToday ? 'text-blue-700 dark:text-blue-300 font-bold' : ''
                    }`}
                  >
                    {cell.day}
                  </span>
                  {taskCount > 0 && (
                    <span
                      title={`${taskCount} tarea(s) en esta fecha`}
                      aria-label={`${taskCount} tarea(s)`}
                      className="text-[10px] leading-none text-blue-700 dark:text-blue-300"
                    >
                      ●
                    </span>
                  )}
                </div>

                <div className="flex items-end justify-between w-full mt-1">
                  {shiftMeta ? (
                    <span
                      className={`font-mono text-[11px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md leading-none ${shiftMeta.badgeClasses}`}
                    >
                      {shiftMeta.code}
                    </span>
                  ) : (
                    <span className="text-[10px] text-transparent select-none">-</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
          {SHIFT_CODES.map((code) => (
            <span key={code} className="inline-flex items-center gap-1.5">
              <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{code}</span>
              <span>= {SHIFT_META[code].label}</span>
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <span className="text-blue-700 dark:text-blue-400">●</span>
            <span>= Tarea con fecha</span>
          </span>
        </div>
      </div>

      {/* Módulo 4: Estadísticas de Turnos */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Estadísticas de turnos
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cálculo automático desde el calendario · Vacaciones disp. {annualBalance.vacacionesDisponibles}/{annualBalance.vacacionesTotales} · AP disp. {annualBalance.apDisponibles}/{annualBalance.apTotales}
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start">
            <button
              type="button"
              onClick={() => setStatsScope('year')}
              className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors ${
                statsScope === 'year'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Año {viewYear}
            </button>
            <button
              type="button"
              onClick={() => setStatsScope('month')}
              className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors ${
                statsScope === 'month'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {MESES_ES[viewMonth]}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
            <div className="text-xs text-slate-500 dark:text-slate-400">Mañanas (M)</div>
            <div className="mt-1 font-mono text-2xl font-bold text-sky-700 dark:text-sky-400 tabular-nums">
              {activeStats.M}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
            <div className="text-xs text-slate-500 dark:text-slate-400">Tardes (T)</div>
            <div className="mt-1 font-mono text-2xl font-bold text-amber-700 dark:text-amber-400 tabular-nums">
              {activeStats.T}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
            <div className="text-xs text-slate-500 dark:text-slate-400">Noches (N)</div>
            <div className="mt-1 font-mono text-2xl font-bold text-indigo-700 dark:text-indigo-400 tabular-nums">
              {activeStats.N}
            </div>
          </div>
          <div className="rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/60 dark:bg-blue-950/30 p-3.5">
            <div className="text-xs font-medium text-blue-800 dark:text-blue-300">
              Total servicios
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-blue-900 dark:text-blue-200 tabular-nums">
              {activeStats.totalServicios}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
            <div className="text-xs text-slate-500 dark:text-slate-400">Vacaciones (V)</div>
            <div className="mt-1 font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {activeStats.V}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
            <div className="text-xs text-slate-500 dark:text-slate-400">Asuntos P. (AP)</div>
            <div className="mt-1 font-mono text-2xl font-bold text-violet-700 dark:text-violet-400 tabular-nums">
              {activeStats.AP}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
            <div className="text-xs text-slate-500 dark:text-slate-400">HE Mañana (HEM)</div>
            <div className="mt-1 font-mono text-2xl font-bold text-cyan-700 dark:text-cyan-400 tabular-nums">
              {activeStats.HEM}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
            <div className="text-xs text-slate-500 dark:text-slate-400">HE Tarde (HET)</div>
            <div className="mt-1 font-mono text-2xl font-bold text-orange-700 dark:text-orange-400 tabular-nums">
              {activeStats.HET}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
            <div className="text-xs text-slate-500 dark:text-slate-400">HE Noche (HEN)</div>
            <div className="mt-1 font-mono text-2xl font-bold text-rose-700 dark:text-rose-400 tabular-nums">
              {activeStats.HEN}
            </div>
          </div>
          <div className="rounded-xl border border-cyan-200 dark:border-cyan-800/80 bg-cyan-50/60 dark:bg-cyan-950/30 p-3.5">
            <div className="text-xs font-medium text-cyan-800 dark:text-cyan-300">
              Total horas extra
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-cyan-900 dark:text-cyan-200 tabular-nums">
              {activeStats.totalHorasExtra}
            </div>
          </div>
        </div>
      </section>

      {/* Manual Edit Modal for Vacaciones & Asuntos Propios */}
      {quotasModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setQuotasModalOpen(false)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Vacaciones y AP ({viewYear})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Se descuentan automáticamente al marcar V o AP
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuotasModalOpen(false)}
                aria-label="Cerrar editor de cupos"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuotas} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Vacaciones disponibles
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={vacDispInput}
                    onChange={(e) => setVacDispInput(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 font-mono text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Vacaciones totales año
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={vacTotInput}
                    onChange={(e) => setVacTotInput(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 font-mono text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    AP disponibles
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={apDispInput}
                    onChange={(e) => setApDispInput(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 font-mono text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    AP totales año
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={apTotInput}
                    onChange={(e) => setApTotInput(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 font-mono text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setQuotasModalOpen(false)}
                  className="min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold"
                >
                  Guardar ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
