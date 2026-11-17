import React, { useMemo, useState } from 'react';
import { Calendar, Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TaskItem, TaskPriority } from '../types/app';
import { formatNumericDate, formatShortBadgeDate } from '../utils/dateUtils';

type TaskFilter = 'todas' | 'pendientes' | 'completadas' | 'con_fecha';
type TaskSort = 'fecha' | 'prioridad' | 'creacion';

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  1: 'Baja',
  2: 'Media',
  3: 'Alta',
};

const PRIORITY_TEXT_COLORS: Record<TaskPriority, string> = {
  1: 'text-slate-500 dark:text-slate-400',
  2: 'text-amber-700 dark:text-amber-400',
  3: 'text-rose-700 dark:text-rose-400',
};

export const TasksView: React.FC = () => {
  const { state, addTask, updateTask, toggleTaskComplete, deleteTask, showToast } = useApp();

  const [filter, setFilter] = useState<TaskFilter>('todas');
  const [sortBy, setSortBy] = useState<TaskSort>('fecha');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [prioridad, setPrioridad] = useState<TaskPriority>(2);

  const openCreateModal = () => {
    setEditingTask(null);
    setTitulo('');
    setDescripcion('');
    setFecha('');
    setPrioridad(2);
    setModalOpen(true);
  };

  const openEditModal = (task: TaskItem) => {
    setEditingTask(task);
    setTitulo(task.titulo);
    setDescripcion(task.descripcion);
    setFecha(task.fecha ?? '');
    setPrioridad(task.prioridad);
    setModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    if (editingTask) {
      updateTask(editingTask.id, {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fecha: fecha || null,
        prioridad,
      });
      showToast('Tarea actualizada', 'success');
    } else {
      addTask({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fecha: fecha || null,
        prioridad,
      });
      showToast('Tarea creada', 'success');
    }
    setModalOpen(false);
  };

  const filteredTasks = useMemo(() => {
    const base = state.tasks.filter((t) => {
      if (filter === 'pendientes') return !t.completada;
      if (filter === 'completadas') return t.completada;
      if (filter === 'con_fecha') return t.fecha !== null;
      return true;
    });

    return [...base].sort((a, b) => {
      if (a.completada !== b.completada) return a.completada ? 1 : -1;
      if (sortBy === 'fecha') {
        if (a.fecha && b.fecha) return a.fecha.localeCompare(b.fecha);
        if (a.fecha) return -1;
        if (b.fecha) return 1;
        return b.prioridad - a.prioridad;
      }
      if (sortBy === 'prioridad') {
        if (b.prioridad !== a.prioridad) return b.prioridad - a.prioridad;
        return (a.fecha ?? '9999-99-99').localeCompare(b.fecha ?? '9999-99-99');
      }
      return b.fecha_creacion.localeCompare(a.fecha_creacion);
    });
  }, [state.tasks, filter, sortBy]);

  const counts = useMemo(() => {
    return {
      todas: state.tasks.length,
      pendientes: state.tasks.filter((t) => !t.completada).length,
      completadas: state.tasks.filter((t) => t.completada).length,
      con_fecha: state.tasks.filter((t) => t.fecha !== null).length,
    };
  }, [state.tasks]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:px-6">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
          {(
            [
              { id: 'todas', label: `Todas (${counts.todas})` },
              { id: 'pendientes', label: `Pendientes (${counts.pendientes})` },
              { id: 'completadas', label: `Completadas (${counts.completadas})` },
              { id: 'con_fecha', label: `Con fecha (${counts.con_fecha})` },
            ] as Array<{ id: TaskFilter; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`min-h-[40px] px-3 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                filter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            aria-label="Ordenar tareas"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as TaskSort)}
            className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
          >
            <option value="fecha">Ordenar por fecha</option>
            <option value="prioridad">Ordenar por prioridad</option>
            <option value="creacion">Más recientes</option>
          </select>

          <button
            type="button"
            onClick={openCreateModal}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva tarea</span>
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No hay tareas en esta vista.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Crea una tarea personal con o sin fecha vinculada al calendario.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 min-h-[44px] inline-flex items-center gap-1.5 px-4 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-semibold"
            >
              <Plus className="h-4 w-4" />
              <span>Crear primera tarea</span>
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleTaskComplete(task.id)}
                  className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0 text-left py-1"
                >
                  <span
                    className={`mt-0.5 sm:mt-0 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      task.completada
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950'
                    }`}
                  >
                    {task.completada && <Check className="h-3.5 w-3.5" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium ${
                        task.completada
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {task.titulo}
                    </p>
                    {task.descripcion && (
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {task.descripcion}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className={`font-semibold ${PRIORITY_TEXT_COLORS[task.prioridad]}`}>
                        Prioridad {PRIORITY_LABELS[task.prioridad]}
                      </span>
                      {task.fecha && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-mono text-blue-700 dark:text-blue-400 tabular-nums">
                            <Calendar className="h-3 w-3" />
                            {formatShortBadgeDate(task.fecha)} ({formatNumericDate(task.fecha)})
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(task)}
                    aria-label={`Editar tarea ${task.titulo}`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskToDelete(task)}
                    aria-label={`Eliminar tarea ${task.titulo}`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create / Edit Task Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                {editingTask ? 'Editar tarea' : 'Nueva tarea'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Cerrar formulario de tarea"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="task-title"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Título
                </label>
                <input
                  id="task-title"
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej. Comprar guantes o revisar equipo"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="task-desc"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Descripción (opcional)
                </label>
                <textarea
                  id="task-desc"
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles adicionales..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="task-date"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Fecha (calendario)
                  </label>
                  <input
                    id="task-date"
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-sm font-mono text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="task-prio"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Prioridad
                  </label>
                  <select
                    id="task-prio"
                    value={prioridad}
                    onChange={(e) => setPrioridad(Number(e.target.value) as TaskPriority)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
                  >
                    <option value={1}>1 · Baja</option>
                    <option value={2}>2 · Media</option>
                    <option value={3}>3 · Alta</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold"
                >
                  {editingTask ? 'Guardar cambios' : 'Crear tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Task Confirmation Modal */}
      {taskToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-task-title"
          onClick={() => setTaskToDelete(null)}
        >
          <div
            className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3
                id="delete-task-title"
                className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
              >
                ¿Eliminar tarea?
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                Se eliminará permanentemente la tarea{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  «{taskToDelete.titulo}»
                </span>
                .
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteTask(taskToDelete.id);
                  setTaskToDelete(null);
                  showToast('Tarea eliminada', 'info');
                }}
                className="min-h-[44px] px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
