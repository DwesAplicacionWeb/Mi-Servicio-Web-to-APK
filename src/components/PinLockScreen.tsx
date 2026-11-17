import React, { useState } from 'react';
import { Delete, Lock, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const PinLockScreen: React.FC = () => {
  const { unlockWithPin } = useApp();
  const [digits, setDigits] = useState<string>('');
  const [error, setError] = useState(false);

  const handleDigit = (d: string) => {
    if (digits.length >= 4) return;
    const next = digits + d;
    setError(false);
    setDigits(next);

    if (next.length === 4) {
      const ok = unlockWithPin(next);
      if (!ok) {
        setError(true);
        window.setTimeout(() => {
          setDigits('');
        }, 420);
      }
    }
  };

  const handleBackspace = () => {
    setError(false);
    setDigits((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F4F6F9] dark:bg-[#0B1120] p-6">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Mi Servicio
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Introduce tu PIN personal para acceder
          </p>

          {/* PIN Dots */}
          <div className="mt-6 flex items-center justify-center gap-4" aria-label="PIN introducido">
            {[0, 1, 2, 3].map((idx) => {
              const filled = idx < digits.length;
              return (
                <div
                  key={idx}
                  className={`h-3.5 w-3.5 rounded-full border transition-all duration-150 ${
                    error
                      ? 'border-rose-500 bg-rose-500 scale-110'
                      : filled
                        ? 'border-blue-600 bg-blue-600 dark:border-blue-400 dark:bg-blue-400 scale-110'
                        : 'border-slate-300 dark:border-slate-700 bg-transparent'
                  }`}
                />
              );
            })}
          </div>

          <div className="mt-3 h-5 text-xs font-medium text-rose-600 dark:text-rose-400">
            {error ? 'PIN incorrecto. Inténtalo de nuevo.' : ''}
          </div>
        </div>

        {/* Tactile Keypad */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="flex h-14 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 font-mono text-xl font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-transform focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              {num}
            </button>
          ))}
          <div className="flex h-14 items-center justify-center text-slate-400 dark:text-slate-600">
            <Lock className="h-4 w-4" />
          </div>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="flex h-14 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 font-mono text-xl font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-transform focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Borrar dígito"
            className="flex h-14 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-transform focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
