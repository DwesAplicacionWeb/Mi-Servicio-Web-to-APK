import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Eraser,
  Heart,
  MessageSquareText,
  Scale,
  Search,
  StickyNote,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import rawCodificadoData from '../data/codificadoTrafico.json';
import {
  CodificadoGravedad,
  CodificadoInfraction,
  CodificadoNorm,
} from '../types/app';

const INFRACTIONS = rawCodificadoData as CodificadoInfraction[];

type NormFilter = 'ALL' | CodificadoNorm;
type SecondaryFilter =
  | 'FAVORITOS'
  | 'MUY_GRAVE'
  | 'GRAVE'
  | 'LEVE'
  | 'ASEGURAMIENTO'
  | 'CON_PUNTOS';

const NORM_META: Array<{
  id: NormFilter;
  shortLabel: string;
  fullTitle: string;
}> = [
  { id: 'ALL', shortLabel: 'TODOS', fullTitle: 'Todas las normas del Codificado DGT (Oct 2026)' },
  { id: 'CIR', shortLabel: 'RGC · CIR', fullTitle: 'Reglamento General de Circulación (RD 1428/2003)' },
  { id: 'VEH', shortLabel: 'RGV · VEH', fullTitle: 'Reglamento General de Vehículos (RD 2822/1998)' },
  { id: 'CON', shortLabel: 'RGCon · CON', fullTitle: 'Reglamento General de Conductores (RD 818/2009)' },
  { id: 'SDA', shortLabel: 'SDA', fullTitle: 'Seguro de los vehículos personales ligeros (VPL)' },
  { id: 'SOA', shortLabel: 'SOA', fullTitle: 'Seguro obligatorio de vehículos a motor' },
  { id: 'LSV', shortLabel: 'LSV', fullTitle: 'Ley de Tráfico y Seguridad Vial (RDL 6/2015)' },
  { id: 'EPC', shortLabel: 'EPC', fullTitle: 'Escuelas particulares de conductores' },
  { id: 'CRC', shortLabel: 'CRC', fullTitle: 'Centros de reconocimiento de conductores' },
];

const NORM_ACRONYM: Record<CodificadoNorm, string> = {
  CIR: 'RGC',
  VEH: 'RGV',
  CON: 'RGCon',
  SDA: 'SDA',
  SOA: 'SOA',
  LSV: 'LSV',
  EPC: 'EPC',
  CRC: 'CRC',
};

const PAGE_STEP = 40;

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getGravedadColorClass(gravedad: CodificadoGravedad): string {
  switch (gravedad) {
    case 'Muy grave':
      return 'text-rose-700 dark:text-rose-400';
    case 'Grave':
      return 'text-amber-700 dark:text-amber-400';
    case 'Aseguramiento':
      return 'text-violet-700 dark:text-violet-400';
    default:
      return 'text-slate-600 dark:text-slate-400';
  }
}

export const CodificadoTraficoView: React.FC = () => {
  const { state, toggleCodificadoFavorite, setCodificadoNote } = useApp();

  const [selectedNorm, setSelectedNorm] = useState<NormFilter>('ALL');
  const [activeFilters, setActiveFilters] = useState<SecondaryFilter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [visibleLimit, setVisibleLimit] = useState<number>(PAGE_STEP);

  const favoriteSet = useMemo(
    () => new Set(state.codificadoFavorites ?? []),
    [state.codificadoFavorites]
  );
  const notesMap = state.codificadoNotes ?? {};

  const normCounts = useMemo(() => {
    const counts: Record<NormFilter, number> = {
      ALL: INFRACTIONS.length,
      CIR: 0,
      VEH: 0,
      CON: 0,
      SDA: 0,
      SOA: 0,
      LSV: 0,
      EPC: 0,
      CRC: 0,
    };
    for (const item of INFRACTIONS) {
      counts[item.norma] = (counts[item.norma] ?? 0) + 1;
    }
    return counts;
  }, []);

  const toggleSecondaryFilter = (filter: SecondaryFilter) => {
    setVisibleLimit(PAGE_STEP);
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const handleSelectNorm = (norm: NormFilter) => {
    setSelectedNorm(norm);
    setVisibleLimit(PAGE_STEP);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setVisibleLimit(PAGE_STEP);
  };

  const resetAllFilters = () => {
    setSelectedNorm('ALL');
    setActiveFilters([]);
    setSearchQuery('');
    setVisibleLimit(PAGE_STEP);
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredInfractions = useMemo(() => {
    const q = normalizeText(searchQuery.trim());
    const gravFilters = activeFilters.filter(
      (f) => f === 'MUY_GRAVE' || f === 'GRAVE' || f === 'LEVE' || f === 'ASEGURAMIENTO'
    );
    const onlyFavs = activeFilters.includes('FAVORITOS');
    const onlyPoints = activeFilters.includes('CON_PUNTOS');

    return INFRACTIONS.filter((item) => {
      if (selectedNorm !== 'ALL' && item.norma !== selectedNorm) {
        return false;
      }
      if (onlyFavs && !favoriteSet.has(item.id)) {
        return false;
      }
      if (onlyPoints && item.puntos <= 0) {
        return false;
      }
      if (gravFilters.length > 0) {
        const matchesGrav =
          (gravFilters.includes('MUY_GRAVE') && item.gravedad === 'Muy grave') ||
          (gravFilters.includes('GRAVE') && item.gravedad === 'Grave') ||
          (gravFilters.includes('LEVE') && item.gravedad === 'Leve') ||
          (gravFilters.includes('ASEGURAMIENTO') && item.gravedad === 'Aseguramiento');
        if (!matchesGrav) return false;
      }
      if (q) {
        const userNote = notesMap[item.id] ?? '';
        const haystack = normalizeText(
          `${item.codigo} ${NORM_ACRONYM[item.norma]} ${item.art} ${item.hecho} ${item.materia} ${item.observaciones} ${item.comentario} ${item.responsable} ${userNote}`
        );
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [selectedNorm, activeFilters, searchQuery, favoriteSet, notesMap]);

  const totalForCurrentNorm = normCounts[selectedNorm];
  const visibleItems = filteredInfractions.slice(0, visibleLimit);
  const hasMore = visibleItems.length < filteredInfractions.length;
  const activeNormMeta = NORM_META.find((n) => n.id === selectedNorm) ?? NORM_META[0];
  const hasActiveFilters =
    selectedNorm !== 'ALL' || activeFilters.length > 0 || searchQuery.trim().length > 0;

  return (
    <div className="space-y-5">
      {/* Header & Search */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-blue-700 dark:text-blue-400 shrink-0" />
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                Codificado DGT de Tráfico
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {activeNormMeta.fullTitle} · Consulta rápida offline (octubre 2026)
            </p>
          </div>

          <div className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
            Favoritos: <span className="font-semibold text-slate-900 dark:text-slate-100">{favoriteSet.size}</span>
            {' · '}
            Notas: <span className="font-semibold text-slate-900 dark:text-slate-100">{Object.keys(notesMap).length}</span>
          </div>
        </div>

        {/* Norm Tabs Strip */}
        <div
          role="tablist"
          aria-label="Filtrar por norma"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1"
        >
          {NORM_META.map((norm) => {
            const active = selectedNorm === norm.id;
            return (
              <button
                key={norm.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleSelectNorm(norm.id)}
                className={`min-h-[40px] shrink-0 px-3 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap tabular-nums ${
                  active
                    ? 'bg-blue-700 text-white border-blue-700 dark:bg-blue-600 dark:border-blue-600'
                    : 'bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {norm.shortLabel}{' '}
                <span className={active ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}>
                  ({normCounts[norm.id]})
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por código (CIR 003, VEH 001), artículo, hecho, materia o tu nota..."
            className="w-full min-h-[44px] pl-10 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => toggleSecondaryFilter('FAVORITOS')}
            className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold border transition-colors ${
              activeFilters.includes('FAVORITOS')
                ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <Heart
              className={`h-3.5 w-3.5 ${
                activeFilters.includes('FAVORITOS') ? 'fill-current' : ''
              }`}
            />
            <span>Favoritos</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSecondaryFilter('MUY_GRAVE')}
            className={`min-h-[38px] px-3 rounded-xl text-xs font-semibold border transition-colors ${
              activeFilters.includes('MUY_GRAVE')
                ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            Muy grave
          </button>

          <button
            type="button"
            onClick={() => toggleSecondaryFilter('GRAVE')}
            className={`min-h-[38px] px-3 rounded-xl text-xs font-semibold border transition-colors ${
              activeFilters.includes('GRAVE')
                ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            Grave
          </button>

          <button
            type="button"
            onClick={() => toggleSecondaryFilter('LEVE')}
            className={`min-h-[38px] px-3 rounded-xl text-xs font-semibold border transition-colors ${
              activeFilters.includes('LEVE')
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            Leve
          </button>

          <button
            type="button"
            onClick={() => toggleSecondaryFilter('ASEGURAMIENTO')}
            className={`min-h-[38px] px-3 rounded-xl text-xs font-semibold border transition-colors ${
              activeFilters.includes('ASEGURAMIENTO')
                ? 'bg-violet-50 text-violet-700 border-violet-300 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            Aseguramiento
          </button>

          <button
            type="button"
            onClick={() => toggleSecondaryFilter('CON_PUNTOS')}
            className={`min-h-[38px] px-3 rounded-xl text-xs font-semibold border transition-colors ${
              activeFilters.includes('CON_PUNTOS')
                ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            Con puntos
          </button>
        </div>
      </section>

      {/* Results Status Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
          Mostrando{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {filteredInfractions.length}
          </span>{' '}
          de{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {totalForCurrentNorm}
          </span>{' '}
          infracciones
        </p>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetAllFilters}
            className="min-h-[36px] inline-flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
          >
            <Eraser className="h-3.5 w-3.5" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      {/* Results List */}
      {filteredInfractions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            No se encontraron infracciones con los filtros actuales.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="min-h-[44px] inline-flex items-center justify-center px-4 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-semibold"
          >
            Mostrar todas las infracciones
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => {
            const isExpanded = Boolean(expandedIds[item.id]);
            const isFav = favoriteSet.has(item.id);
            const personalNote = notesMap[item.id] ?? '';
            const hasNote = personalNote.trim().length > 0;

            return (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-colors"
              >
                {/* Clickable Summary Card Header */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(item.id)}
                      aria-expanded={isExpanded}
                      className="flex-1 text-left min-w-0 group"
                    >
                      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                        <span className="font-mono text-sm font-bold text-blue-700 dark:text-blue-400 tracking-tight">
                          {item.codigo}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {NORM_ACRONYM[item.norma]}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                          ·
                        </span>
                        <span className={`text-xs font-semibold ${getGravedadColorClass(item.gravedad)}`}>
                          {item.gravedad}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                          {item.importe}
                        </span>
                        {item.puntos > 0 && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                              ·
                            </span>
                            <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-400 tabular-nums">
                              {item.puntos} pts
                            </span>
                          </>
                        )}
                        {hasNote && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                              ·
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-400">
                              <StickyNote className="h-3 w-3" />
                              <span>Con nota</span>
                            </span>
                          </>
                        )}
                      </div>

                      <p className="mt-2 text-sm leading-relaxed font-medium text-slate-900 dark:text-slate-100">
                        {item.hecho}
                      </p>

                      <p className="mt-2 font-mono text-xs text-slate-500 dark:text-slate-400">
                        Art. {item.art} · Apt. {item.apt} · Opc. {item.opc}
                        {item.materia ? ` · ${item.materia}` : ''}
                      </p>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleCodificadoFavorite(item.id)}
                        aria-label={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                        className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors ${
                          isFav
                            ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
                            : 'text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleExpanded(item.id)}
                        aria-label={isExpanded ? 'Contraer detalles' : 'Ver detalles y nota personal'}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-4 sm:p-5 space-y-4">
                    {/* 4-column Key Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Importe
                        </div>
                        <div className="mt-1 font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                          {item.importe}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Reducción 50%
                        </div>
                        <div className="mt-1 font-mono text-sm font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                          {item.reduccion}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Puntos
                        </div>
                        <div
                          className={`mt-1 font-mono text-sm font-bold tabular-nums ${
                            item.puntos > 0
                              ? 'text-rose-700 dark:text-rose-400'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {item.puntos > 0 ? item.puntosTexto : 'Sin detracción'}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Gravedad
                        </div>
                        <div
                          className={`mt-1 text-sm font-bold ${getGravedadColorClass(
                            item.gravedad
                          )}`}
                        >
                          {item.gravedad}
                        </div>
                      </div>
                    </div>

                    {/* Responsable & Materia */}
                    {(item.responsable || item.materia) && (
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {item.responsable && (
                          <span>
                            <strong className="font-semibold text-slate-900 dark:text-slate-100">
                              Responsable:
                            </strong>{' '}
                            {item.responsable}
                          </span>
                        )}
                        {item.responsable && item.materia && (
                          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                            ·
                          </span>
                        )}
                        {item.materia && (
                          <span>
                            <strong className="font-semibold text-slate-900 dark:text-slate-100">
                              Materia:
                            </strong>{' '}
                            {item.materia}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Observaciones */}
                    {item.observaciones && (
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100 mb-1">
                          <MessageSquareText className="h-3.5 w-3.5 text-slate-400" />
                          <span>Observaciones</span>
                        </div>
                        <p>{item.observaciones}</p>
                      </div>
                    )}

                    {/* Comentario */}
                    {item.comentario && (
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                          Comentario DGT
                        </div>
                        <p>{item.comentario}</p>
                      </div>
                    )}

                    {/* MI NOTA */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor={`note-${item.id}`}
                          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                        >
                          <StickyNote className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Mi nota personal</span>
                        </label>
                        {hasNote && (
                          <button
                            type="button"
                            onClick={() => setCodificadoNote(item.id, '')}
                            className="text-xs font-medium text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          >
                            Borrar nota
                          </button>
                        )}
                      </div>
                      <textarea
                        id={`note-${item.id}`}
                        rows={2}
                        value={personalNote}
                        onChange={(e) => setCodificadoNote(item.id, e.target.value)}
                        placeholder="Escribe aquí tu anotación sobre esta infracción..."
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y"
                      />
                    </div>
                  </div>
                )}
              </article>
            );
          })}

          {hasMore && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleLimit((prev) => prev + PAGE_STEP)}
                className="min-h-[44px] px-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors tabular-nums"
              >
                Mostrar {Math.min(PAGE_STEP, filteredInfractions.length - visibleItems.length)} más (
                {filteredInfractions.length - visibleItems.length} restantes)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
