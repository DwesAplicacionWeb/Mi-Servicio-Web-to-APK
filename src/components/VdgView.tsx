import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Search,
  X,
} from 'lucide-react';
import { WomanIcon } from './WomanIcon';

type ViolenceScope = 'VG' | 'VD-P' | 'VD-F';
type QualificationScope = 'VG' | 'VD' | 'VG/VD';
type QualificationAction = 'detener' | 'delito_leve';

interface ViolenceTypeInfo {
  code: ViolenceScope;
  title: string;
  description: string;
  cohabitationRequired: boolean;
}

interface VdgQualification {
  scope: QualificationScope;
  action: QualificationAction;
  headline: string;
  detail: string;
}

interface VdgCase {
  number: number;
  title: string;
  tags: Array<'VG' | 'VD'>;
  note?: string;
  qualifications: VdgQualification[];
}

const VIOLENCE_TYPES: ViolenceTypeInfo[] = [
  {
    code: 'VG',
    title: 'Violencia de Género',
    description:
      'Del hombre a la mujer en una relación de pareja presente o pasada análoga a la matrimonial (noviazgos y parejas estables).',
    cohabitationRequired: false,
  },
  {
    code: 'VD-P',
    title: 'Violencia Doméstica de Pareja',
    description:
      'Resto de relaciones de pareja presentes o pasadas (de mujer a hombre o entre parejas homosexuales).',
    cohabitationRequired: false,
  },
  {
    code: 'VD-F',
    title: 'Violencia Doméstica Familiar',
    description:
      'Ascendientes, descendientes y hermanos incluidos los que son por afinidad (suegros, nuera, yerno y cuñados).',
    cohabitationRequired: true,
  },
];

const VDG_CASES: VdgCase[] = [
  {
    number: 1,
    title: 'Injuria o Vejación Injusta Leve',
    tags: ['VG', 'VD'],
    note: 'Insultos, faltas de respeto, etc. NOTA: Si la injuria o vejación injusta es grave y causa un menoscabo psíquico (ej: ataque de ansiedad) detener por art 153 CP.',
    qualifications: [
      {
        scope: 'VG/VD',
        action: 'delito_leve',
        headline: 'DELITO LEVE ART 173.4',
        detail: 'Injuria: Requiere Denuncia. Vejación Injusta Leve: No requiere denuncia.',
      },
    ],
  },
  {
    number: 2,
    title: 'Golpear o Maltratar de Obra sin causar lesión',
    tags: ['VG', 'VD'],
    note: 'Producir menoscabo psíquico o causar una lesión leve. Ej: Empujón, colleja, tirón de pelos, bofetón, cualquier contacto físico por leve que sea.',
    qualifications: [
      {
        scope: 'VG',
        action: 'detener',
        headline: 'DETENER ART 153.1',
        detail: 'No requiere denuncia.',
      },
      {
        scope: 'VD',
        action: 'detener',
        headline: 'DETENER ART 153.2',
        detail: 'No requiere denuncia.',
      },
    ],
  },
  {
    number: 3,
    title: 'Amenazas Leves sin arma ni instrumento peligroso',
    tags: ['VG', 'VD'],
    note: 'NOTA: Si la amenaza es grave detener en todo caso por delito del art 169 CP.',
    qualifications: [
      {
        scope: 'VG',
        action: 'detener',
        headline: 'DETENER ART 171.4',
        detail: 'No requiere denuncia.',
      },
      {
        scope: 'VD',
        action: 'delito_leve',
        headline: 'DELITO LEVE ART 171.7',
        detail: 'No requiere denuncia.',
      },
    ],
  },
  {
    number: 4,
    title: 'Amenazas Leves con arma o instrumento peligroso',
    tags: ['VG', 'VD'],
    qualifications: [
      {
        scope: 'VG',
        action: 'detener',
        headline: 'DETENER ART 171.4',
        detail: 'No requiere denuncia.',
      },
      {
        scope: 'VD',
        action: 'detener',
        headline: 'DETENER ART 171.5',
        detail: 'No requiere denuncia.',
      },
    ],
  },
  {
    number: 5,
    title: 'Coacciones Leves',
    tags: ['VG', 'VD'],
    note: 'NOTA: Si la coacción es grave detener en todo caso por delito del art 172.1 CP.',
    qualifications: [
      {
        scope: 'VG',
        action: 'detener',
        headline: 'DETENER ART 172.2',
        detail: 'No requiere denuncia.',
      },
      {
        scope: 'VD',
        action: 'delito_leve',
        headline: 'DELITO LEVE ART 172.3',
        detail: 'No requiere denuncia.',
      },
    ],
  },
  {
    number: 6,
    title: 'Malos Tratos Habituales',
    tags: ['VG', 'VD'],
    note: 'Cuando la violencia física o psíquica sea habitual y no un caso aislado. Ej: víctima declara que no es la primera vez que ocurren los hechos o que existen anteriores episodios de violencia aunque no los denunciara.',
    qualifications: [
      {
        scope: 'VG/VD',
        action: 'detener',
        headline: 'DETENER ART 173.2',
        detail:
          'No requiere denuncia. Es un delito independiente al motivo inicial del requerimiento que castiga el comportamiento habitual del autor.',
      },
    ],
  },
  {
    number: 7,
    title: 'Acoso',
    tags: ['VG', 'VD'],
    note: 'Llevando a cabo de forma insistente y reiterada alguna de las conductas del artículo 172 ter del Código Penal.',
    qualifications: [
      {
        scope: 'VG/VD',
        action: 'detener',
        headline: 'DETENER ART 172 TER',
        detail: 'No requiere denuncia.',
      },
    ],
  },
];

type ScopeFilter = 'ALL' | 'VG' | 'VD';

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getViolenceCodeClass(code: ViolenceScope | QualificationScope): string {
  if (code === 'VG') {
    return 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/80 dark:bg-rose-950/60 dark:text-rose-300';
  }
  if (code === 'VG/VD') {
    return 'border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200';
  }
  return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/80 dark:bg-amber-950/60 dark:text-amber-300';
}

export const VdgView: React.FC = () => {
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedMap, setCollapsedMap] = useState<Record<number, boolean>>({});

  const toggleCard = (num: number) => {
    setCollapsedMap((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  const allCollapsed = useMemo(
    () => VDG_CASES.every((c) => Boolean(collapsedMap[c.number])),
    [collapsedMap]
  );

  const toggleAllCards = () => {
    const nextState: Record<number, boolean> = {};
    const target = !allCollapsed;
    for (const c of VDG_CASES) {
      nextState[c.number] = target;
    }
    setCollapsedMap(nextState);
  };

  const filteredCases = useMemo(() => {
    const q = normalizeText(searchQuery.trim());
    return VDG_CASES.filter((item) => {
      if (!q) return true;
      const qualText = item.qualifications
        .map((ql) => `${ql.scope} ${ql.headline} ${ql.detail}`)
        .join(' ');
      const haystack = normalizeText(`${item.number} ${item.title} ${item.note ?? ''} ${qualText}`);
      return haystack.includes(q);
    });
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      {/* TIPOS DE VIOLENCIA Card */}
      <section
        aria-label="Tipos de violencia y requisitos de convivencia"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
      >
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 flex items-center gap-2.5">
          <ClipboardList className="h-4 w-4 text-blue-700 dark:text-blue-400 shrink-0" />
          <h2 className="font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Tipos de violencia
          </h2>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {VIOLENCE_TYPES.map((vt) => (
            <div
              key={vt.code}
              className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-5"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <span
                  className={`inline-flex items-center justify-center min-w-[54px] rounded-lg border px-2.5 py-1 font-mono text-xs font-bold shrink-0 mt-0.5 ${getViolenceCodeClass(
                    vt.code
                  )}`}
                >
                  {vt.code}
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {vt.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {vt.description}
                  </p>
                </div>
              </div>

              <div className="sm:text-right shrink-0 pl-[68px] sm:pl-0">
                <span
                  className={`inline-block rounded-lg border px-3 py-1 text-xs font-bold whitespace-nowrap ${
                    vt.cohabitationRequired
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/80 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}
                >
                  {vt.cohabitationRequired ? 'SÍ requiere convivencia' : 'NO requiere convivencia'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Filter & Search Bar for Supuestos */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <WomanIcon className="h-4 w-4 text-blue-700 dark:text-blue-400 shrink-0" />
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Calificación policial por supuesto
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Filtrar calificación por ámbito"
              className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-1"
            >
              {(
                [
                  { id: 'ALL', label: 'Todos (VG y VD)' },
                  { id: 'VG', label: 'Solo VG' },
                  { id: 'VD', label: 'Solo VD' },
                ] as Array<{ id: ScopeFilter; label: string }>
              ).map((tab) => {
                const active = scopeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setScopeFilter(tab.id)}
                    className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-blue-700 text-white dark:bg-blue-600'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={toggleAllCards}
              className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {allCollapsed ? 'Expandir todos' : 'Contraer todos'}
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar supuesto, artículo (153, 171, 172, 173...) o indicación..."
            className="w-full min-h-[44px] pl-10 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </section>

      {/* Numbered Supuestos List */}
      {filteredCases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            No se encontraron supuestos que coincidan con «{searchQuery}».
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="min-h-[44px] px-4 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-semibold"
          >
            Mostrar los 7 supuestos
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCases.map((item) => {
            const isCollapsed = Boolean(collapsedMap[item.number]);
            const visibleQualifications = item.qualifications.filter((ql) => {
              if (scopeFilter === 'ALL') return true;
              if (scopeFilter === 'VG') return ql.scope === 'VG' || ql.scope === 'VG/VD';
              return ql.scope === 'VD' || ql.scope === 'VG/VD';
            });

            return (
              <article
                key={item.number}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
              >
                {/* Header Row */}
                <button
                  type="button"
                  onClick={() => toggleCard(item.number)}
                  aria-expanded={!isCollapsed}
                  className="w-full p-4 sm:px-6 flex items-start justify-between gap-3 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 dark:bg-blue-600 text-white font-mono text-xs font-bold shrink-0 mt-0.5 tabular-nums">
                      {item.number}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {item.title}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`inline-block rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold ${getViolenceCodeClass(
                              tag
                            )}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <span className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 shrink-0">
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </span>
                </button>

                {/* Body */}
                {!isCollapsed && (
                  <div className="px-4 sm:px-6 pb-5 pt-1 space-y-4">
                    {item.note && (
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-4 py-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {item.note}
                      </div>
                    )}

                    <div className="space-y-2.5">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Calificación policial
                      </div>

                      <div className="space-y-2.5">
                        {visibleQualifications.map((ql, idx) => {
                          const isDetener = ql.action === 'detener';
                          return (
                            <div
                              key={`${ql.scope}-${idx}`}
                              className={`rounded-xl border p-3.5 sm:p-4 space-y-1.5 ${
                                isDetener
                                  ? 'border-rose-200 bg-rose-50/70 dark:border-rose-900/70 dark:bg-rose-950/25'
                                  : 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/70 dark:bg-emerald-950/25'
                              }`}
                            >
                              <div className="flex flex-wrap items-center gap-2.5">
                                <span
                                  className={`inline-block rounded-md border px-2 py-0.5 font-mono text-xs font-bold ${getViolenceCodeClass(
                                    ql.scope
                                  )}`}
                                >
                                  {ql.scope}
                                </span>
                                <span
                                  className={`font-mono text-xs sm:text-sm font-bold tracking-tight ${
                                    isDetener
                                      ? 'text-rose-700 dark:text-rose-300'
                                      : 'text-emerald-700 dark:text-emerald-300'
                                  }`}
                                >
                                  {ql.headline}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                                {ql.detail}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
