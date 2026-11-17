import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckSquare,
  ClipboardList,
  FlaskConical,
  Link2,
  RotateCcw,
  Scale,
  ShieldAlert,
  Square,
} from 'lucide-react';

interface DrugSubstance {
  id: 'hachis' | 'marihuana' | 'cocaina' | 'tusi' | 'speed' | 'extasis';
  nombre: string;
  subtitulo: string;
  umbralGramos: number;
  umbralTexto: string;
  graveDano: boolean;
  swatchClass: string;
  notaTipo: string;
}

const SUBSTANCES: DrugSubstance[] = [
  {
    id: 'hachis',
    nombre: 'Hachís',
    subtitulo: 'Resina de cannabis',
    umbralGramos: 25,
    umbralTexto: '25 g',
    graveDano: false,
    swatchClass: 'bg-amber-800 dark:bg-amber-700',
    notaTipo: 'El cannabis y derivados tienen penas base menores al no causar grave daño a la salud.',
  },
  {
    id: 'marihuana',
    nombre: 'Marihuana',
    subtitulo: 'Hierba / sumidades floridas',
    umbralGramos: 100,
    umbralTexto: '100 g',
    graveDano: false,
    swatchClass: 'bg-emerald-600 dark:bg-emerald-500',
    notaTipo: 'El cannabis y derivados tienen penas base menores al no causar grave daño a la salud.',
  },
  {
    id: 'cocaina',
    nombre: 'Cocaína',
    subtitulo: 'Clorhidrato / base',
    umbralGramos: 7.5,
    umbralTexto: '7,5 g',
    graveDano: true,
    swatchClass: 'bg-slate-200 border border-slate-300 dark:bg-slate-300 dark:border-slate-500',
    notaTipo: 'Al tratarse de sustancia que causa grave daño a la salud, la pena base es más elevada.',
  },
  {
    id: 'tusi',
    nombre: 'Tusi',
    subtitulo: 'Cocaína rosa / mezclas 2C-B',
    umbralGramos: 2.4,
    umbralTexto: '2,4 g',
    graveDano: true,
    swatchClass: 'bg-pink-500 dark:bg-pink-400',
    notaTipo: 'Al tratarse de sustancia que causa grave daño a la salud, la pena base es más elevada.',
  },
  {
    id: 'speed',
    nombre: 'Speed',
    subtitulo: 'Sulfato de anfetamina',
    umbralGramos: 0.9,
    umbralTexto: '0,9 g',
    graveDano: true,
    swatchClass: 'bg-orange-500 dark:bg-orange-400',
    notaTipo: 'Al tratarse de sustancia que causa grave daño a la salud, la pena base es más elevada.',
  },
  {
    id: 'extasis',
    nombre: 'Éxtasis (MDMA)',
    subtitulo: 'Pastillas o cristal MDMA',
    umbralGramos: 2.4,
    umbralTexto: '2,4 g',
    graveDano: true,
    swatchClass: 'bg-rose-500 dark:bg-rose-400',
    notaTipo: 'Al tratarse de sustancia que causa grave daño a la salud, la pena base es más elevada.',
  },
];

interface CalculationResult {
  substance: DrugSubstance;
  grams: number;
  isOverThreshold: boolean;
  hasTraffickingIndicators: boolean;
}

function formatGrams(val: number): string {
  return val.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

export const DrugCalculatorView: React.FC = () => {
  const [selectedId, setSelectedId] = useState<DrugSubstance['id']>('hachis');
  const [amountInput, setAmountInput] = useState<string>('');
  const [hasIndicators, setHasIndicators] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const selectedSubstance = useMemo(
    () => SUBSTANCES.find((s) => s.id === selectedId) ?? SUBSTANCES[0],
    [selectedId]
  );

  const handleSelectSubstance = (id: DrugSubstance['id']) => {
    setSelectedId(id);
    setErrorMsg(null);
    if (result) {
      const nextSub = SUBSTANCES.find((s) => s.id === id) ?? SUBSTANCES[0];
      setResult({
        substance: nextSub,
        grams: result.grams,
        isOverThreshold: result.grams > nextSub.umbralGramos,
        hasTraffickingIndicators: hasIndicators,
      });
    }
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = amountInput.trim().replace(',', '.');
    const parsed = Number(normalized);

    if (!normalized || Number.isNaN(parsed) || parsed <= 0) {
      setErrorMsg('Introduce una cantidad válida en gramos mayor que 0.');
      return;
    }

    setErrorMsg(null);
    setResult({
      substance: selectedSubstance,
      grams: parsed,
      isOverThreshold: parsed > selectedSubstance.umbralGramos,
      hasTraffickingIndicators: hasIndicators,
    });
  };

  const handleReset = () => {
    setResult(null);
    setAmountInput('');
    setHasIndicators(false);
    setErrorMsg(null);
  };

  const isCriminalResult = result
    ? result.isOverThreshold || result.hasTraffickingIndicators
    : false;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Main Input Card */}
      <form
        onSubmit={handleCalculate}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 space-y-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-blue-700 dark:text-blue-400 shrink-0" />
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                Calculadora orientativa de sustancias
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Comparativa rápida entre tenencia administrativa (LO 4/2015) y presunto delito contra la salud pública (Art. 368 CP)
            </p>
          </div>
        </div>

        {/* Substance Selector Grid */}
        <div className="space-y-2">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Sustancia
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {SUBSTANCES.map((sub) => {
              const active = sub.id === selectedId;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleSelectSubstance(sub.id)}
                  aria-pressed={active}
                  className={`min-h-[76px] flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-colors ${
                    active
                      ? 'border-amber-500 bg-amber-50/70 dark:border-amber-400 dark:bg-amber-950/35 text-slate-900 dark:text-slate-100 ring-1 ring-amber-500/40'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-sm shrink-0 ${sub.swatchClass}`}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-semibold leading-tight">{sub.nombre}</span>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    Límite: {sub.umbralTexto}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Substance Summary Strip */}
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/25 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {selectedSubstance.nombre}{' '}
              <span className="font-normal text-xs text-slate-500 dark:text-slate-400">
                ({selectedSubstance.subtitulo})
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  selectedSubstance.graveDano ? 'bg-rose-600 dark:bg-rose-400' : 'bg-amber-500'
                }`}
                aria-hidden="true"
              />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {selectedSubstance.graveDano
                  ? 'Causa grave daño a la salud'
                  : 'No causa grave daño a la salud'}
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Consumo propio
            </div>
            <div className="font-mono text-base font-bold text-amber-700 dark:text-amber-400 tabular-nums">
              ≤ {selectedSubstance.umbralTexto}
            </div>
          </div>
        </div>

        {/* Quantity Input */}
        <div className="space-y-2">
          <label
            htmlFor="drug-amount-input"
            className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
          >
            Cantidad incautada
          </label>
          <div className="flex items-stretch gap-2">
            <input
              id="drug-amount-input"
              type="text"
              inputMode="decimal"
              value={amountInput}
              onChange={(e) => {
                setAmountInput(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Ej: 15 o 0,9"
              className="flex-1 min-h-[52px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 px-4 text-right font-mono text-xl font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 placeholder:text-sm placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-600 tabular-nums"
            />
            <div className="min-w-[54px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-mono text-base font-semibold text-slate-700 dark:text-slate-300">
              g
            </div>
          </div>
          {errorMsg && (
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{errorMsg}</p>
          )}
        </div>

        {/* Optional Trafficking Indicators Checkbox */}
        <button
          type="button"
          onClick={() => {
            const next = !hasIndicators;
            setHasIndicators(next);
            if (result) {
              setResult({
                ...result,
                hasTraffickingIndicators: next,
              });
            }
          }}
          className={`w-full min-h-[48px] flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
            hasIndicators
              ? 'border-rose-300 bg-rose-50/70 dark:border-rose-800 dark:bg-rose-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <span className="mt-0.5 text-slate-700 dark:text-slate-300 shrink-0">
            {hasIndicators ? (
              <CheckSquare className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            ) : (
              <Square className="h-4 w-4 text-slate-400" />
            )}
          </span>
          <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="font-semibold text-slate-900 dark:text-slate-100">
              Concurren indicios de tráfico ilícito:
            </strong>{' '}
            droga repartida en pequeñas dosis/envoltorios, dinero fraccionado, báscula de precisión u otros indicios de venta.
          </span>
        </button>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display text-sm font-bold tracking-wide transition-colors"
        >
          <Scale className="h-4 w-4" />
          <span>CALCULAR</span>
        </button>
      </form>

      {/* Evaluation Result Card */}
      {result && (
        <section
          aria-live="polite"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
        >
          {/* Result Header Banner */}
          <div
            className={`px-5 py-4 flex items-center gap-3.5 text-white ${
              isCriminalResult
                ? 'bg-blue-700 dark:bg-blue-800'
                : 'bg-amber-600 dark:bg-amber-700'
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 shrink-0">
              {isCriminalResult ? (
                <Scale className="h-5 w-5" />
              ) : (
                <ClipboardList className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold leading-tight">
                {isCriminalResult ? 'Delito penal' : 'Infracción administrativa'}
              </h3>
              <p className="text-xs text-white/90 mt-0.5">
                {isCriminalResult
                  ? result.substance.graveDano
                    ? 'Sustancia que causa grave daño a la salud'
                    : 'Sustancia que no causa grave daño a la salud'
                  : 'Ley Orgánica 4/2015 de Seguridad Ciudadana'}
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Legal Precept */}
            <div>
              <span
                className={`inline-block rounded-lg border px-3 py-1 font-mono text-xs font-bold ${
                  isCriminalResult
                    ? 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                {isCriminalResult ? 'Art. 368 CP' : 'Art. 36.16 LO 4/2015'}
              </span>
            </div>

            {/* Narrative Summary */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 p-4 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
              {result.isOverThreshold ? (
                <p>
                  <strong className="font-mono tabular-nums">
                    {formatGrams(result.grams)} g
                  </strong>{' '}
                  de <strong>{result.substance.nombre}</strong> supera el umbral de consumo propio (
                  <span className="font-mono tabular-nums">{result.substance.umbralTexto}</span>). Se
                  presume finalidad de tráfico.
                </p>
              ) : result.hasTraffickingIndicators ? (
                <p>
                  Aunque{' '}
                  <strong className="font-mono tabular-nums">
                    {formatGrams(result.grams)} g
                  </strong>{' '}
                  de <strong>{result.substance.nombre}</strong> no supera el umbral cuantitativo (
                  <span className="font-mono tabular-nums">{result.substance.umbralTexto}</span>), al
                  concurrir <strong>indicios de tráfico</strong> (pequeñas dosis, dinero fraccionado
                  u otros elementos), los hechos pueden constituir un{' '}
                  <strong>delito contra la salud pública (Art. 368 CP)</strong>.
                </p>
              ) : (
                <p>
                  <strong className="font-mono tabular-nums">
                    {formatGrams(result.grams)} g
                  </strong>{' '}
                  de <strong>{result.substance.nombre}</strong> está por debajo o en el umbral de
                  consumo propio (
                  <span className="font-mono tabular-nums">{result.substance.umbralTexto}</span>). No
                  se presume tráfico por cantidad. Se sanciona únicamente el consumo o tenencia en
                  lugar público.
                </p>
              )}
            </div>

            {/* Consecuencia Jurídica */}
            {isCriminalResult ? (
              <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 p-4 space-y-2.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  Consecuencia jurídica
                </div>

                {/* Grave daño option */}
                <div
                  className={`flex items-start gap-3 rounded-xl border p-3.5 transition-opacity ${
                    result.substance.graveDano
                      ? 'border-rose-300 bg-white dark:border-rose-800 dark:bg-slate-900'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 opacity-45'
                  }`}
                >
                  <span className="mt-0.5 shrink-0">
                    {result.substance.graveDano ? (
                      <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-rose-800 dark:text-rose-300">
                      Prisión de 3 a 6 años y multa del tanto al triplo del valor de la droga
                    </div>
                    <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Sustancias que causan grave daño a la salud
                    </div>
                  </div>
                </div>

                {/* No grave daño option */}
                <div
                  className={`flex items-start gap-3 rounded-xl border p-3.5 transition-opacity ${
                    !result.substance.graveDano
                      ? 'border-rose-300 bg-white dark:border-rose-800 dark:bg-slate-900'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 opacity-45'
                  }`}
                >
                  <span className="mt-0.5 shrink-0">
                    {!result.substance.graveDano ? (
                      <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-rose-800 dark:text-rose-300">
                      Prisión de 1 a 3 años y multa del tanto al duplo del valor de la droga
                    </div>
                    <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Resto de casos (no causan grave daño a la salud)
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-1">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  Consecuencia jurídica
                </div>
                <div className="font-display text-lg font-bold text-amber-700 dark:text-amber-300">
                  Multa de 601 € a 30.000 €
                </div>
              </div>
            )}

            {/* Warning on small quantities with indicators */}
            {!result.isOverThreshold && (
              <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/25 p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed space-y-1">
                  <div className="font-bold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                    Advertencia operativa: posible delito con menor cantidad
                  </div>
                  <p>
                    Aunque no alcance el umbral orientativo ({result.substance.umbralTexto}),{' '}
                    <strong>puede constituir delito penal (Art. 368 CP)</strong> si la sustancia
                    viene repartida en pequeñas dosis/papelinas, existe dinero fraccionado, báscula
                    de precisión u otros indicios de venta o distribución.
                  </p>
                </div>
              </div>
            )}

            {/* A tener en cuenta */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                A tener en cuenta
              </h4>
              {isCriminalResult ? (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <li className="py-2 flex items-start gap-2">
                    <span className="text-slate-400">›</span>
                    <span>
                      {result.isOverThreshold
                        ? 'La superación del umbral de consumo propio crea una presunción iuris tantum de tráfico.'
                        : 'Con cantidad inferior al umbral, los indicios periféricos (dosis individualizadas, dinero fraccionado, útiles) resultan determinantes para motivar el atestado.'}
                    </span>
                  </li>
                  <li className="py-2 flex items-start gap-2">
                    <span className="text-slate-400">›</span>
                    <span>
                      El investigado puede desvirtuar la presunción acreditando que era para consumo
                      personal.
                    </span>
                  </li>
                  <li className="py-2 flex items-start gap-2">
                    <span className="text-slate-400">›</span>
                    <span>{result.substance.notaTipo}</span>
                  </li>
                </ul>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <li className="py-2 flex items-start gap-2">
                    <span className="text-slate-400">›</span>
                    <span>
                      Solo aplicable si la tenencia es en la vía pública o en lugares accesibles al
                      público.
                    </span>
                  </li>
                  <li className="py-2 flex items-start gap-2">
                    <span className="text-slate-400">›</span>
                    <span>En domicilio particular no hay infracción administrativa.</span>
                  </li>
                  <li className="py-2 flex items-start gap-2">
                    <span className="text-slate-400">›</span>
                    <span>El consumo y la tenencia en privado NO son infracción.</span>
                  </li>
                  <li className="py-2 flex items-start gap-2">
                    <span className="text-slate-400">›</span>
                    <span>La droga se incautará en todo caso como medida cautelar.</span>
                  </li>
                </ul>
              )}
            </div>

            {/* DETENCIÓN Callout */}
            {isCriminalResult && (
              <div className="rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30 p-4 flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
                  <Link2 className="h-4 w-4" />
                </div>
                <div className="space-y-1 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                  <div className="font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Detención</span>
                  </div>
                  <p>
                    {result.isOverThreshold
                      ? 'La cantidad supera el umbral de consumo propio. '
                      : 'Al apreciarse indicios objetivos de tráfico, '}
                    Procede valorar la <strong>detención del interesado</strong> como presunto autor
                    de un delito contra la salud pública (<strong>Art. 368 CP</strong>), con traslado
                    a dependencias policiales y puesta a disposición judicial en el plazo máximo de{' '}
                    <strong>72 horas</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Reset Consultation */}
            <button
              type="button"
              onClick={handleReset}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Nueva consulta</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
