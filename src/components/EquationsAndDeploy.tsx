import { Check, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import {
  RelativityMetrics,
  SimulationParams,
  buildShareableUrl,
} from '../physics/relativity';

interface EquationsAndDeployProps {
  params: SimulationParams;
  metrics: RelativityMetrics;
}

export function EquationsAndDeploy({
  params,
  metrics,
}: EquationsAndDeployProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyShareLink = async () => {
    const shareUrl = buildShareableUrl(params);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback: update URL bar quietly without using alert()
      window.history.replaceState(null, '', shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div className="space-y-12">
      {/* Live Equations & Physical Intuition */}
      <section
        id="ecuaciones"
        aria-label="Derivación matemática en vivo"
        className="space-y-4 scroll-mt-20"
      >
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-50">
            Derivación Geométrica y Sustitución en Vivo
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            El segundo postulado de Einstein fija la velocidad de la luz c como invariante; el triángulo del reloj en movimiento explica ambos efectos simultáneamente.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time dilation card */}
          <article className="rounded-lg border border-slate-800 bg-[#111827] p-6 space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-display text-base font-semibold text-slate-100">
                01. Dilatación del Tiempo
              </h3>
              <span className="font-mono text-xs text-cyan-300 tabular-nums">
                Δt = γ · Δt₀
              </span>
            </div>

            <p className="text-sm leading-relaxed text-slate-300">
              En el marco donde el reloj está en reposo, el fotón recorre verticalmente la altura{' '}
              <span className="font-mono text-slate-100">H = {params.mirrorHeightM.toFixed(1)} m</span>{' '}
              en un semiciclo{' '}
              <span className="font-mono text-slate-100">Δt₀ = {metrics.properHalfTickNs.toFixed(2)} ns</span>.
              Al moverse lateralmente a{' '}
              <span className="font-mono text-cyan-300">{metrics.beta.toFixed(3)}c</span>, el fotón traza una hipotenusa más larga{' '}
              <span className="font-mono text-slate-100">c·Δt/2 = {metrics.photonDiagonalPathM.toFixed(2)} m</span>.
            </p>

            <div className="rounded-md border border-slate-800 bg-[#0B0E17] p-4 font-mono text-xs space-y-2 tabular-nums">
              <div className="text-slate-400">
                (c · Δt)² = H² + (v · Δt)²  ⇒  γ = 1 / √(1 − β²)
              </div>
              <div className="text-slate-100">
                γ = 1 / √(1 − {metrics.beta.toFixed(3)}²) ={' '}
                <span className="text-cyan-300 font-semibold">{metrics.gamma.toFixed(4)}</span>
              </div>
              <div className="text-slate-100">
                Δt = {metrics.gamma.toFixed(4)} × {metrics.properHalfTickNs.toFixed(2)} ns ={' '}
                <span className="text-amber-300 font-semibold">{metrics.dilatedHalfTickNs.toFixed(2)} ns</span>
              </div>
            </div>
          </article>

          {/* Length contraction card */}
          <article className="rounded-lg border border-slate-800 bg-[#111827] p-6 space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-display text-base font-semibold text-slate-100">
                02. Contracción de Longitud
              </h3>
              <span className="font-mono text-xs text-amber-300 tabular-nums">
                L = L₀ / γ
              </span>
            </div>

            <p className="text-sm leading-relaxed text-slate-300">
              Para que ambos observadores midan la misma velocidad relativa{' '}
              <span className="font-mono text-slate-100">v</span> mientras sus relojes marcan tiempos distintos, la longitud paralela al movimiento debe contraerse en el mismo factor{' '}
              <span className="font-mono text-slate-100">γ</span>. Por eso los muones atmosféricos (0.994c) recorren una atmósfera contraída y llegan al suelo antes de desintegrarse.
            </p>

            <div className="rounded-md border border-slate-800 bg-[#0B0E17] p-4 font-mono text-xs space-y-2 tabular-nums">
              <div className="text-slate-400">
                L = L₀ · √(1 − β²) = L₀ / γ
              </div>
              <div className="text-slate-100">
                L = {params.properLengthM.toFixed(0)} m / {metrics.gamma.toFixed(4)} ={' '}
                <span className="text-amber-300 font-semibold">{metrics.contractedLengthM.toFixed(2)} m</span>
              </div>
              <div className="text-slate-300">
                Reducción longitudinal: −{metrics.contractionPercent.toFixed(2)}% (dimensiones verticales H invariantes)
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Static Architecture & GitHub Pages Guide */}
      <section
        id="github-pages"
        aria-label="Compatibilidad estática con GitHub Pages"
        className="rounded-lg border border-slate-800 bg-[#111827] p-6 scroll-mt-20"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <h2 className="font-display text-lg font-semibold text-slate-50">
              Arquitectura Estática Compatible con GitHub Pages
            </h2>
            <p className="text-sm leading-relaxed text-slate-300">
              Este simulador opera 100% en el navegador mediante HTML5 Canvas, SVG interactivo y TypeScript compilado con rutas relativas (<span className="font-mono text-xs text-cyan-300">base: &apos;./&apos;</span>). No requiere servidor Node.js, base de datos ni variables secretas para publicarse en{' '}
              <span className="font-mono text-xs text-slate-200">usuario.github.io/repositorio/</span>.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-slate-400">
              <span>1. npm run build</span>
              <span aria-hidden="true">·</span>
              <span>2. Publicar carpeta dist/</span>
              <span aria-hidden="true">·</span>
              <span>3. Estado compartible por parámetros URL</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-[#0B0E17] px-4 py-2.5 text-xs font-medium text-slate-100 hover:border-cyan-500/70 hover:text-cyan-200 transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  <span>Enlace copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Copiar enlace del ensayo</span>
                </>
              )}
            </button>

            <a
              href="https://docs.github.com/es/pages/getting-started-with-github-pages/creating-a-github-pages-site"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-600 transition-colors whitespace-nowrap"
            >
              <span>Guía GitHub Pages</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
