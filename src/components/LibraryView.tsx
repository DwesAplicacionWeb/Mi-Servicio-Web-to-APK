import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Download,
  FileText,
  FolderPlus,
  Plus,
  Search,
  Share2,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DocumentFormat, DocumentItem } from '../types/app';
import { formatNumericDate } from '../utils/dateUtils';
import { getDocumentBlob } from '../utils/fileStorage';

function highlightMatches(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, idx) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark
        key={idx}
        className="bg-amber-200 dark:bg-amber-500/40 text-slate-900 dark:text-slate-100 rounded px-0.5"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export const LibraryView: React.FC = () => {
  const {
    state,
    addCategory,
    addDocument,
    toggleDocumentFavorite,
    deleteDocument,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [activeBlobUrl, setActiveBlobUrl] = useState<string | null>(null);

  // Modals
  const [uploadOpen, setUploadOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  // Upload form
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<string>(state.categories[0]?.nombre ?? 'Ordenanzas');
  const [docSubcategory, setDocSubcategory] = useState<string>(
    state.categories[0]?.subcategorias[0] ?? 'Tráfico'
  );
  const [docFormat, setDocFormat] = useState<DocumentFormat>('TXT');
  const [docText, setDocText] = useState('');
  const [pendingBlob, setPendingBlob] = useState<{
    mimeType: string;
    dataUrl: string;
    fileName: string;
    size: number;
  } | null>(null);

  // New category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatSubs, setNewCatSubs] = useState('');

  // Load blob when opening a document with binary file
  useEffect(() => {
    let cancelled = false;
    setActiveBlobUrl(null);
    if (!activeDoc?.tiene_blob) return;

    getDocumentBlob(activeDoc.id).then((blob) => {
      if (!cancelled && blob) {
        setActiveBlobUrl(blob.dataUrl);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeDoc]);

  const currentDoc = useMemo(() => {
    if (!activeDoc) return null;
    return state.documents.find((d) => d.id === activeDoc.id) ?? null;
  }, [activeDoc, state.documents]);

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.documents.filter((doc) => {
      if (selectedCategory === 'Favoritos' && !doc.favorito) return false;
      if (
        selectedCategory !== 'Todas' &&
        selectedCategory !== 'Favoritos' &&
        doc.categoria !== selectedCategory
      ) {
        return false;
      }
      if (!q) return true;
      return (
        doc.titulo.toLowerCase().includes(q) ||
        doc.categoria.toLowerCase().includes(q) ||
        doc.subcategoria.toLowerCase().includes(q) ||
        doc.contenido_texto.toLowerCase().includes(q)
      );
    });
  }, [state.documents, selectedCategory, searchQuery]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, DocumentItem[]> = {};
    for (const doc of filteredDocs) {
      if (!groups[doc.categoria]) groups[doc.categoria] = [];
      groups[doc.categoria].push(doc);
    }
    return groups;
  }, [filteredDocs]);

  const docMatchCount = useMemo(() => {
    if (!currentDoc || !docSearchQuery.trim()) return 0;
    const escaped = docSearchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = currentDoc.contenido_texto.match(new RegExp(escaped, 'gi'));
    return matches ? matches.length : 0;
  }, [currentDoc, docSearchQuery]);

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toUpperCase();
    const detectedFormat: DocumentFormat =
      ext === 'PDF' ? 'PDF' : ext === 'DOCX' || ext === 'DOC' ? 'DOCX' : 'TXT';
    setDocFormat(detectedFormat);
    if (!docTitle.trim()) {
      setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setPendingBlob({
        mimeType: file.type || 'application/octet-stream',
        dataUrl,
        fileName: file.name,
        size: file.size,
      });

      // For TXT/MD files, also extract readable text for instant full-text search
      if (detectedFormat === 'TXT') {
        const textReader = new FileReader();
        textReader.onload = () => {
          setDocText(String(textReader.result || ''));
        };
        textReader.readAsText(file);
      } else if (!docText.trim()) {
        setDocText(
          `Archivo importado: ${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB).`
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;

    await addDocument(
      {
        titulo: docTitle.trim(),
        categoria: docCategory,
        subcategoria: docSubcategory.trim() || 'General',
        formato: docFormat,
        ruta_archivo: pendingBlob ? `local://${pendingBlob.fileName}` : `local://nota/${Date.now()}.txt`,
        contenido_texto: docText.trim() || 'Documento almacenado localmente para consulta rápida.',
        tamano_bytes: pendingBlob?.size,
        favorito: false,
      },
      pendingBlob ? { mimeType: pendingBlob.mimeType, dataUrl: pendingBlob.dataUrl } : undefined
    );

    setDocTitle('');
    setDocText('');
    setPendingBlob(null);
    setUploadOpen(false);
    showToast('Documento guardado en biblioteca local', 'success');
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const subs = newCatSubs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    addCategory(newCatName.trim(), subs);
    setNewCatName('');
    setNewCatSubs('');
    setCatOpen(false);
    showToast('Categoría creada', 'success');
  };

  const handleShareOrDownload = async (doc: DocumentItem) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: doc.titulo,
          text: doc.contenido_texto.slice(0, 500),
        });
        return;
      } catch {
        // fallback to download
      }
    }

    const href =
      activeBlobUrl ||
      URL.createObjectURL(new Blob([doc.contenido_texto], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = href;
    a.download = `${doc.titulo.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.${
      doc.formato === 'PDF' && activeBlobUrl ? 'pdf' : 'txt'
    }`;
    a.click();
    if (!activeBlobUrl) URL.revokeObjectURL(href);
    showToast('Archivo descargado', 'success');
  };

  // Pantalla 6 - Documento Viewer
  if (currentDoc) {
    return (
      <div className="space-y-4">
        {/* Top Document Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                setActiveDoc(null);
                setDocSearchQuery('');
              }}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
              aria-label="Volver a Biblioteca"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                {currentDoc.titulo}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {currentDoc.categoria} · {currentDoc.subcategoria} · {currentDoc.formato} ·{' '}
                {formatNumericDate(currentDoc.fecha_importacion)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => toggleDocumentFavorite(currentDoc.id)}
              className={`min-h-[44px] inline-flex items-center gap-1.5 px-3.5 rounded-xl border text-xs font-semibold transition-colors ${
                currentDoc.favorito
                  ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Star className={`h-4 w-4 ${currentDoc.favorito ? 'fill-current' : ''}`} />
              <span>Favorito</span>
            </button>

            <button
              type="button"
              onClick={() => handleShareOrDownload(currentDoc)}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {activeBlobUrl ? <Download className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              <span>{activeBlobUrl ? 'Descargar' : 'Compartir'}</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                await deleteDocument(currentDoc.id);
                setActiveDoc(null);
                showToast('Documento eliminado', 'info');
              }}
              aria-label="Eliminar documento"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-600 hover:border-rose-300 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search inside document */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:px-6 flex items-center gap-3">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="search"
            value={docSearchQuery}
            onChange={(e) => setDocSearchQuery(e.target.value)}
            placeholder="Buscar texto dentro del documento..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          {docSearchQuery.trim() && (
            <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
              {docMatchCount} coincidencia{docMatchCount === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {/* Document Content Canvas */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-8">
          {currentDoc.formato === 'PDF' && activeBlobUrl ? (
            <div className="space-y-4">
              <iframe
                title={currentDoc.titulo}
                src={activeBlobUrl}
                className="w-full h-[65vh] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50"
              />
              {currentDoc.contenido_texto && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    Notas indexadas para búsqueda
                  </h3>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {highlightMatches(currentDoc.contenido_texto, docSearchQuery)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm sm:text-[15px] leading-relaxed text-slate-800 dark:text-slate-200 max-w-3xl">
              {highlightMatches(currentDoc.contenido_texto, docSearchQuery)}
            </pre>
          )}
        </div>
      </div>
    );
  }

  // Pantalla 5 - Biblioteca
  const activeCatObj = state.categories.find((c) => c.nombre === docCategory);

  return (
    <div className="space-y-6">
      {/* Search + Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:px-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar ordenanza, protocolo, artículo o texto..."
            className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setCatOpen(true)}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0"
          >
            <FolderPlus className="h-4 w-4" />
            <span>Nueva categoría</span>
          </button>

          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Subir documento</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {['Todas', ...state.categories.map((c) => c.nombre), 'Favoritos'].map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[40px] px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors ${
                active
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Document Groups */}
      {Object.keys(groupedByCategory).length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            No se han encontrado documentos con ese criterio.
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Prueba con otra palabra clave o sube un PDF, DOCX o TXT local.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByCategory).map(([categoryName, docs]) => (
            <section
              key={categoryName}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
            >
              <div className="px-5 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40">
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {categoryName}
                </h3>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {docs.length} doc{docs.length === 1 ? '' : 's'}
                </span>
              </div>

              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {docs.map((doc) => (
                  <li key={doc.id}>
                    <button
                      type="button"
                      onClick={() => setActiveDoc(doc)}
                      className="w-full min-h-[60px] flex items-center justify-between gap-4 px-5 sm:px-6 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {doc.titulo}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {doc.subcategoria} · {doc.formato} ·{' '}
                            {formatNumericDate(doc.fecha_importacion)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {doc.favorito && (
                          <Star className="h-4 w-4 text-amber-500 fill-current" aria-label="Favorito" />
                        )}
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* Upload / Add Document Modal */}
      {uploadOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setUploadOpen(false)}
        >
          <div
            className="w-full sm:max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                Subir documento offline
              </h3>
              <button
                type="button"
                onClick={() => setUploadOpen(false)}
                aria-label="Cerrar subida de documento"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.md"
                  onChange={handleFilePicked}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full min-h-[68px] flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 p-4 text-center hover:border-blue-500 transition-colors"
                >
                  <Upload className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {pendingBlob
                      ? `Seleccionado: ${pendingBlob.fileName}`
                      : 'Seleccionar archivo local (PDF, DOCX, TXT)'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Se guarda localmente en tu dispositivo para acceso sin conexión
                  </span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Título del documento
                </label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Ej. Ordenanza de Terrazas 2026"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={docCategory}
                    onChange={(e) => {
                      const nextCat = e.target.value;
                      setDocCategory(nextCat);
                      const found = state.categories.find((c) => c.nombre === nextCat);
                      setDocSubcategory(found?.subcategorias[0] ?? 'General');
                    }}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
                  >
                    {state.categories.map((c) => (
                      <option key={c.id} value={c.nombre}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Subcategoría
                  </label>
                  {activeCatObj && activeCatObj.subcategorias.length > 0 ? (
                    <select
                      value={docSubcategory}
                      onChange={(e) => setDocSubcategory(e.target.value)}
                      className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
                    >
                      {activeCatObj.subcategorias.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                      <option value="General">General</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={docSubcategory}
                      onChange={(e) => setDocSubcategory(e.target.value)}
                      placeholder="Subcategoría"
                      className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Texto o resumen indexable (para búsquedas rápidas)
                </label>
                <textarea
                  rows={4}
                  value={docText}
                  onChange={(e) => setDocText(e.target.value)}
                  placeholder="Pega aquí el contenido textual o resumen clave para encontrarlo al instante en el buscador..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold"
                >
                  Guardar documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Category Modal */}
      {catOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setCatOpen(false)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                Nueva categoría
              </h3>
              <button
                type="button"
                onClick={() => setCatOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre de la categoría
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ej. Formación o Guías"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Subcategorías (separadas por comas)
                </label>
                <input
                  type="text"
                  value={newCatSubs}
                  onChange={(e) => setNewCatSubs(e.target.value)}
                  placeholder="Ej. Cursos, Manuales, Notas"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCatOpen(false)}
                  className="min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold"
                >
                  Crear categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
