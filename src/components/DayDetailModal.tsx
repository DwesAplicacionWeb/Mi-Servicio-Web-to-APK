import React, { useEffect, useState } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SHIFT_META, ShiftCode, TaskPriority } from '../types/app';
import { formatLongDayTitle, formatNumericDate } from '../utils/dateUtils';

interface DayDetailModalProps {
  fecha: string | null;
  onClose: () => void;
}

const SHIFT_OPTIONS: ShiftCode[] = ['M', 'T', 'N', 'V', 'AP', 'HEM', 'HET', 'HEN'];

export const DayDetailModal: React.FC<DayDetailModalProps> = ({ fecha, onClose }) => {
  const { state, setDayEntry, addTask, toggleTaskComplete, deleteTask, showToast } = useApp();

  const existingDay = fecha ? state.calendarDays[fecha] : undefined;
  const [selectedShift, setSelectedShift] = useState<ShiftCode | null>(existingDay?.servicio ?? null);
  const [observaciones, setObservaciones] = useState<string>(existingDay?.observaciones ?? '');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>(2);
  const [pendingDeleteTaskId, setPendingDeleteTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!fecha) return;
    const day = state.calendarDays[fecha];
    setSelectedShift(day?.servicio ?? null);
    setObservaciones(day?.observaciones ?? '');
    setNewTaskTitle('');
    setNewTaskPriority(2);
    setPendingDeleteTaskId(null);
  }, [fecha, state.calendarDays]);

  if (!fecha) return null;

  const dayTasks = state.tasks.filter((t) => t.fecha === fecha);

  const handleSelectShift = (code: ShiftCode) => {
    const next = selectedShift === code ? null : code;
    setSelectedShift(next);
  };

  const handleSaveNotes = () => {
    setDayEntry(fecha, selectedShift, observaciones);
    showToast('Día actualizado correctamente', 'success');
    onClose();
  };

  const handleAddQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask({
      titulo: newTaskTitle.trim(),
      descripcion: '',
      fecha,
      prioridad: newTaskPriority,
    });
    setNewTaskTitle('');
    showToast('Tarea añadida al día', 'success');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-detail-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2
              id="day-detail-title"
              className="font-display text-xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums"
            >
              {formatLongDayTitle(fecha)}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
              {formatNumericDate(fecha)}
              {selectedShift ? ` · ${SHIFT_META[selectedShift].label}` : ' · Sin servicio asignado'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalle del día"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Shift selector */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Servicio asignado
              </h3>
              {selectedShift && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedShift(null);
                  }}
                  className="text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 py-1 px-2"
                >
                  Quitar turno
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SHIFT_OPTIONS.map((code) => {
                const meta = SHIFT_META[code];
                const active = selectedShift === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleSelectShift(code)}
                    className={`min-h-[48px] flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-left transition-all ${
                      active
                        ? `${meta.cellClasses} ring-2 ring-blue-600 dark:ring-blue-400 font-semibold`
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-sm truncate">{meta.label}</span>
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        active
                          ? meta.badgeClasses
                          : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {code}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Notes */}
          <section>
            <label
              htmlFor="day-observaciones"
              className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2"
            >
              Observaciones personales
            </label>
            <textarea
              id="day-observaciones"
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas sobre el turno, relevo, horario especial..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
            />
          </section>

          {/* Tasks for this day */}
          <section className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Tareas para {formatNumericDate(fecha)}
            </h3>

            {dayTasks.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
                No hay tareas asociadas a este día.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/80 mb-3">
                {dayTasks.map((task) => (
                  <li key={task.id} className="py-2.5">
                    {pendingDeleteTaskId === task.id ? (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-3">
                        <span className="text-xs font-medium text-rose-800 dark:text-rose-200">
                          ¿Eliminar «{task.titulo}»?
                        </span>
                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            type="button"
                            onClick={() => setPendingDeleteTaskId(null)}
                            className="min-h-[38px] px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteTask(task.id);
                              setPendingDeleteTaskId(null);
                              showToast('Tarea eliminada', 'info');
                            }}
                            className="min-h-[38px] px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => toggleTaskComplete(task.id)}
                          className="flex items-center gap-3 min-h-[44px] flex-1 text-left"
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                              task.completada
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950'
                            }`}
                          >
                            {task.completada && <Check className="h-3.5 w-3.5" />}
                          </span>
                          <span
                            className={`text-sm ${
                              task.completada
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-800 dark:text-slate-200 font-medium'
                            }`}
                          >
                            {task.titulo}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteTaskId(task.id)}
                          aria-label={`Eliminar tarea ${task.titulo}`}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Quick Add Task for this date */}
            <form onSubmit={handleAddQuickTask} className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Añadir tarea para este día..."
                className="flex-1 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="min-h-[44px] px-4 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white text-sm font-medium flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Añadir</span>
              </button>
            </form>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleSaveNotes}
            className="min-h-[44px] px-5 rounded-xl bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
};
