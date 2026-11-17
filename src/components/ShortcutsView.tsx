import React, { useState } from 'react';
import {
  Clock,
  ExternalLink,
  Globe,
  Mail,
  Map,
  Pencil,
  Plus,
  Shield,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ShortcutItem } from '../types/app';

function renderShortcutIcon(key: string) {
  switch (key) {
    case 'clock':
      return <Clock className="h-5 w-5" />;
    case 'wallet':
      return <Wallet className="h-5 w-5" />;
    case 'shield':
      return <Shield className="h-5 w-5" />;
    case 'mail':
      return <Mail className="h-5 w-5" />;
    case 'map':
      return <Map className="h-5 w-5" />;
    default:
      return <Globe className="h-5 w-5" />;
  }
}

export const ShortcutsView: React.FC = () => {
  const { state, addShortcut, updateShortcut, deleteShortcut, showToast } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ShortcutItem | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [url, setUrl] = useState('');
  const [icono, setIcono] = useState('globe');

  const openCreate = () => {
    setEditing(null);
    setNombre('');
    setDescripcion('');
    setUrl('https://');
    setIcono('globe');
    setModalOpen(true);
  };

  const openEdit = (item: ShortcutItem) => {
    setEditing(item);
    setNombre(item.nombre);
    setDescripcion(item.descripcion);
    setUrl(item.url);
    setIcono(item.icono);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
    if (!nombre.trim() || !cleanUrl) return;

    if (editing) {
      updateShortcut(editing.id, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || 'Acceso externo',
        url: cleanUrl,
        icono,
      });
      showToast('Acceso directo actualizado', 'success');
    } else {
      addShortcut({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || 'Acceso externo',
        url: cleanUrl,
        icono,
      });
      showToast('Acceso directo añadido', 'success');
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:px-6">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Lanzadores externos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Solo accesos directos al navegador · No se almacenan credenciales ni se intercambian datos
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="min-h-[44px] inline-flex items-center gap-1.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo acceso</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.shortcuts.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5"
          >
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 flex-1 min-w-0 group"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                {renderShortcutIcon(item.icono)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 truncate transition-colors">
                    {item.nombre}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {item.descripcion}
                </p>
                <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500 truncate mt-1">
                  {item.url}
                </p>
              </div>
            </a>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => openEdit(item)}
                aria-label={`Editar enlace ${item.nombre}`}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteShortcut(item.id);
                  showToast('Acceso directo eliminado', 'info');
                }}
                aria-label={`Eliminar enlace ${item.nombre}`}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

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
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                {editing ? 'Editar acceso directo' : 'Nuevo acceso directo'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Kelio, Nóminas, Outlook"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  URL externa
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm font-mono text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Icono
                  </label>
                  <select
                    value={icono}
                    onChange={(e) => setIcono(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="clock">Reloj (Kelio)</option>
                    <option value="wallet">Nóminas</option>
                    <option value="shield">Escudo (RIACNA)</option>
                    <option value="mail">Correo (Outlook)</option>
                    <option value="map">Mapa (IDENA)</option>
                    <option value="globe">Web general</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Opcional"
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
                  />
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
                  Guardar enlace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
