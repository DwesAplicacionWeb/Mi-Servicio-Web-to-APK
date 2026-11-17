import React, { useState } from 'react';
import { Clock, Minus, Plus, RotateCcw, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatHoursBalance, formatNumericDate } from '../utils/dateUtils';

interface HoursBalanceModalProps {
  open: boolean;
  onClose: () => void;
}

export const HoursBalanceModal: React.FC<HoursBalanceModalProps> = ({ open, onClose }) => {
  const { state, adjustHoursBalance, setExactHoursBalance, clearHourMovements, showToast } =
    useApp();

  const [mode, setMode] = useState<'delta' | 'exact'>('delta');
  const [sign, setSign] = useState<'+' | '-'>('+');
  const [hoursInput, setHoursInput] = useState<string>('1');
  const [minsInput, setMinsInput] = useState<string>('0');
  const [motivo, setMotivo] = useState<string>('');

  if (!open) return null;

  const isNegative = state.saldoHorasMinutos < 0;

  const handleQuickAdjust = (delta: number, label: string) => {
    adjustHoursBalance(delta, label);
    showToast(`Saldo actualizado (${delta > 0 ? '+' : ''}${delta} min)`, 'success');
  };

  const handleApplyForm = (e: React.FormEvent) => {
    e.preventDefault();
    const h = Math.max(0, parseInt(hoursInput || '0', 10) || 0);
    const m = Math.max(0, Math.min(59, parseInt(minsInput || '0', 10) || 0));
    const total = (h * 60 + m) * (sign === '-' ? -1 : 1);

    if (mode === 'delta') {
      if (total === 0) return;
      adjustHoursBalance(total, motivo || (sign === '+' ? 'Incremento manual' : 'Reducción manual'));
      showToast('Movimiento registrado en saldo de horas', 'success');
    } else {
      setExactHoursBalance(total, motivo || 'Corrección directa de saldo');
      showToast('Saldo de horas establecido manualmente', 'success');
    }
    setMotivo('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hours-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="hours-modal-title"
                className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
              >
                Saldo de horas
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acumulativo entre años · No se reinicia el 1 de enero
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar saldo de horas"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Current Balance Display */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-5 text-center">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Saldo acumulado actual
            </span>
            <div
              className={`mt-1 font-mono text-3xl font-bold tracking-tight tabular-nums ${
                isNegative
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {formatHoursBalance(state.saldoHorasMinutos)}
            </div>
          </div>

          {/* Quick Adjustments */}
          <section>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5">
              Ajuste rápido
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickAdjust(15, 'Ajuste rápido +15m')}
                className="min-h-[44px] rounded-xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-mono text-sm font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
              >
                +15m
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdjust(30, 'Ajuste rápido +30m')}
                className="min-h-[44px] rounded-xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-mono text-sm font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
              >
                +30m
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdjust(60, 'Ajuste rápido +1h')}
                className="min-h-[44px] rounded-xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-mono text-sm font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
              >
                +1h
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdjust(-15, 'Ajuste rápido -15m')}
                className="min-h-[44px] rounded-xl border border-rose-200 dark:border-rose-800/70 bg-rose-50/70 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 font-mono text-sm font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
              >
                -15m
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdjust(-30, 'Ajuste rápido -30m')}
                className="min-h-[44px] rounded-xl border border-rose-200 dark:border-rose-800/70 bg-rose-50/70 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 font-mono text-sm font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
              >
                -30m
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdjust(-60, 'Ajuste rápido -1h')}
                className="min-h-[44px] rounded-xl border border-rose-200 dark:border-rose-800/70 bg-rose-50/70 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 font-mono text-sm font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
              >
                -1h
              </button>
            </div>
          </section>

          {/* Manual Input Form */}
          <form onSubmit={handleApplyForm} className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setMode('delta')}
                className={`flex-1 min-h-[40px] rounded-lg text-xs font-semibold transition-colors ${
                  mode === 'delta'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Sumar / Restar
              </button>
              <button
                type="button"
                onClick={() => setMode('exact')}
                className={`flex-1 min-h-[40px] rounded-lg text-xs font-semibold transition-colors ${
                  mode === 'exact'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Fijar saldo exacto
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSign('+')}
                  aria-label="Signo positivo"
                  className={`flex-1 min-h-[44px] flex items-center justify-center transition-colors ${
                    sign === '+'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-500'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSign('-')}
                  aria-label="Signo negativo"
                  className={`flex-1 min-h-[44px] flex items-center justify-center transition-colors ${
                    sign === '-'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-500'
                  }`}
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
              <div>
                <label className="sr-only" htmlFor="hours-val">
                  Horas
                </label>
                <div className="relative">
                  <input
                    id="hours-val"
                    type="number"
                    min="0"
                    max="999"
                    value={hoursInput}
                    onChange={(e) => setHoursInput(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-3 pr-7 font-mono text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                    h
                  </span>
                </div>
              </div>
              <div>
                <label className="sr-only" htmlFor="mins-val">
                  Minutos
                </label>
                <div className="relative">
                  <input
                    id="mins-val"
                    type="number"
                    min="0"
                    max="59"
                    value={minsInput}
                    onChange={(e) => setMinsInput(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-3 pr-7 font-mono text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                    m
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Motivo opcional (ej. compensación servicio)"
                className="flex-1 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
              />
              <button
                type="submit"
                className="min-h-[44px] px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium shrink-0 transition-colors"
              >
                Aplicar
              </button>
            </div>
          </form>

          {/* Optional Movement History */}
          {state.hourMovements.length > 0 && (
            <section className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Historial reciente
                </h3>
                <button
                  type="button"
                  onClick={clearHourMovements}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 py-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Limpiar historial
                </button>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-40 overflow-y-auto">
                {state.hourMovements.map((mov) => (
                  <li key={mov.id} className="flex items-center justify-between py-2 text-xs">
                    <div className="min-w-0 pr-3">
                      <p className="text-slate-800 dark:text-slate-200 truncate font-medium">
                        {mov.motivo}
                      </p>
                      <p className="text-slate-400 tabular-nums">{formatNumericDate(mov.fecha)}</p>
                    </div>
                    <span
                      className={`font-mono font-semibold tabular-nums shrink-0 ${
                        mov.deltaMinutos < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {formatHoursBalance(mov.deltaMinutos)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
