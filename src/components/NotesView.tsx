import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Mic,
  MicOff,
  Pencil,
  RotateCcw,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NoteItem } from '../types/app';
import { formatNumericDate } from '../utils/dateUtils';

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [altIndex: number]: { transcript: string };
    };
  };
}

interface SpeechRecognitionInstanceLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstanceLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

export const NotesView: React.FC = () => {
  const { state, addNote, updateNote, deleteNote, showToast } = useApp();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<NoteItem | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null);
  const keepRecordingRef = useRef(false);
  const speechSupported = useMemo(() => getSpeechRecognitionCtor() !== null, []);

  // Stop microphone cleanly on unmount
  useEffect(() => {
    return () => {
      keepRecordingRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore cleanup errors
      }
    };
  }, []);

  const stopDictation = () => {
    keepRecordingRef.current = false;
    setIsRecording(false);
    setInterimText('');
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore stop errors
    }
  };

  const startDictation = () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setSpeechError(
        'El dictado directo no está disponible en este navegador. Puedes usar el micrófono del teclado del móvil dentro del cuadro de texto.'
      );
      return;
    }

    setSpeechError(null);
    keepRecordingRef.current = true;

    const recognition = new Ctor();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let finalChunk = '';
      let interimChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) {
          finalChunk += transcript;
        } else {
          interimChunk += transcript;
        }
      }

      if (finalChunk.trim()) {
        setContenido((prev) => {
          const cleanPrev = prev.trimEnd();
          const cleanFinal = finalChunk.trim();
          return cleanPrev ? `${cleanPrev} ${cleanFinal}` : cleanFinal;
        });
      }
      setInterimText(interimChunk.trim());
    };

    recognition.onerror = (event: { error: string }) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setSpeechError('Permiso de micrófono denegado. Actívalo en los ajustes del navegador.');
        keepRecordingRef.current = false;
        setIsRecording(false);
        setInterimText('');
      } else if (event.error === 'audio-capture') {
        setSpeechError('No se ha detectado ningún micrófono disponible.');
        keepRecordingRef.current = false;
        setIsRecording(false);
        setInterimText('');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setSpeechError('No se pudo completar el dictado por voz. Inténtalo de nuevo.');
        keepRecordingRef.current = false;
        setIsRecording(false);
        setInterimText('');
      }
    };

    recognition.onend = () => {
      setInterimText('');
      if (keepRecordingRef.current) {
        try {
          recognition.start();
        } catch {
          keepRecordingRef.current = false;
          setIsRecording(false);
        }
      } else {
        setIsRecording(false);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsRecording(true);
    } catch {
      keepRecordingRef.current = false;
      setIsRecording(false);
      setSpeechError('No se pudo iniciar el micrófono. Comprueba los permisos.');
    }
  };

  const handleToggleDictation = () => {
    if (isRecording) {
      stopDictation();
    } else {
      startDictation();
    }
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contenido.trim()) {
      showToast('Escribe o dicta algún texto antes de guardar', 'error');
      return;
    }
    if (isRecording) {
      stopDictation();
    }

    if (editingId) {
      updateNote(editingId, { titulo, contenido });
      showToast('Nota actualizada', 'success');
      setEditingId(null);
    } else {
      addNote({ titulo, contenido });
      showToast('Nota guardada localmente', 'success');
    }
    setTitulo('');
    setContenido('');
  };

  const handleEditNote = (note: NoteItem) => {
    if (isRecording) stopDictation();
    setEditingId(note.id);
    setTitulo(note.titulo);
    setContenido(note.contenido);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearEditor = () => {
    if (isRecording) stopDictation();
    setEditingId(null);
    setTitulo('');
    setContenido('');
    setSpeechError(null);
  };

  const handleCopyText = async (text: string, id = 'editor') => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast('Texto copiado al portapapeles', 'success');
      window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
    } catch {
      showToast('No se pudo copiar el texto', 'error');
    }
  };

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = state.notes ?? [];
    if (!q) return list;
    return list.filter(
      (n) => n.titulo.toLowerCase().includes(q) || n.contenido.toLowerCase().includes(q)
    );
  }, [state.notes, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Editor & Voice Dictation Card */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
        <form onSubmit={handleSaveNote} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                {editingId ? 'Editando nota guardada' : 'Cuadro de notas rápidas'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Escribe directamente o pulsa el micrófono para dictar por voz
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleDictation}
              className={`min-h-[48px] inline-flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-blue-700 hover:bg-blue-800 text-white'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="h-4 w-4" />
                  <span>Detener dictado</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  <span>Dictar con micrófono</span>
                </>
              )}
            </button>
          </div>

          {/* Optional Title */}
          <div>
            <label htmlFor="note-title" className="sr-only">
              Título de la nota
            </label>
            <input
              id="note-title"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título breve (opcional, se genera automático si se deja vacío)"
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Main Text Box */}
          <div>
            <label htmlFor="note-content" className="sr-only">
              Contenido de la nota
            </label>
            <textarea
              id="note-content"
              rows={7}
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder="Escribe aquí tus anotaciones personales o pulsa «Dictar con micrófono» para transcribir tu voz..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-sm sm:text-[15px] leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none resize-y"
            />
          </div>

          {/* Live Dictation Status / Interim Preview */}
          {isRecording && (
            <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 px-4 py-3 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2.5">
              <Mic className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <div className="min-w-0">
                <span className="font-semibold">Escuchando en español… </span>
                <span className="text-blue-800/80 dark:text-blue-300/80">
                  {interimText || 'Habla con claridad cerca del micrófono'}
                </span>
              </div>
            </div>
          )}

          {speechError && (
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{speechError}</p>
          )}

          {!speechSupported && !speechError && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Consejo: en dispositivos sin API de dictado web, puedes pulsar el micrófono integrado
              del teclado del móvil dentro del cuadro de texto.
            </p>
          )}

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearEditor}
                disabled={!titulo && !contenido && !editingId}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>{editingId ? 'Cancelar edición' : 'Limpiar'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyText(contenido, 'editor')}
                disabled={!contenido.trim()}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                {copiedId === 'editor' ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span>Copiar</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={!contenido.trim()}
              className="min-h-[44px] inline-flex items-center gap-2 px-5 rounded-xl bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{editingId ? 'Actualizar nota' : 'Guardar nota'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Saved Notes List */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Notas guardadas
            </h3>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {(state.notes ?? []).length}
            </span>
          </div>

          {(state.notes ?? []).length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en notas..."
                className="w-full min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
              />
            </div>
          )}
        </div>

        {filteredNotes.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {(state.notes ?? []).length === 0
                ? 'Todavía no tienes notas guardadas.'
                : 'No hay notas que coincidan con la búsqueda.'}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Usa el cuadro superior para escribir o dictar anotaciones personales rápidas.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredNotes.map((note) => (
              <li
                key={note.id}
                className="px-5 sm:px-6 py-4 flex items-start justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {note.titulo}
                    </h4>
                    <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
                      {formatNumericDate(note.fecha_actualizacion)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap line-clamp-3">
                    {note.contenido}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyText(note.contenido, note.id)}
                    aria-label={`Copiar nota ${note.titulo}`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {copiedId === note.id ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditNote(note)}
                    aria-label={`Editar nota ${note.titulo}`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteToDelete(note)}
                    aria-label={`Eliminar nota ${note.titulo}`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Delete Note Confirmation Modal */}
      {noteToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-note-title"
          onClick={() => setNoteToDelete(null)}
        >
          <div
            className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3
                id="delete-note-title"
                className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
              >
                ¿Eliminar nota?
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                Se eliminará permanentemente la nota{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  «{noteToDelete.titulo}»
                </span>
                .
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setNoteToDelete(null)}
                className="min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingId === noteToDelete.id) {
                    handleClearEditor();
                  }
                  deleteNote(noteToDelete.id);
                  setNoteToDelete(null);
                  showToast('Nota eliminada', 'info');
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
