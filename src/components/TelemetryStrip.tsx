import {
  RelativityMetrics,
  SimulationParams,
  getRegimeClassification,
} from '../physics/relativity';

interface TelemetryStripProps {
  params: SimulationParams;
  metrics: RelativityMetrics;
}

export function TelemetryStrip({ params, metrics }: TelemetryStripProps) {
  const regime = getRegimeClassification(metrics.gamma);

  return (
    <section
      aria-label="Telemetría relativista en tiempo real"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {/* KPI 1: Lorentz Factor */}
      <div className="rounded-lg border border-slate-800 bg-[#111827] p-4">
        <div className="text-[11px] font-medium tracking-wider uppercase text-slate-400">
          Factor de Lorentz (γ)
        </div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-mono text-2xl font-semibold text-slate-50 tabular-nums">
            {metrics.gamma.toFixed(4)}
          </span>
          <span className="font-mono text-xs text-slate-400">adimensional</span>
        </div>
        <div className={`mt-2 font-mono text-xs font-medium ${regime.toneClass}`}>
          {regime.glyph} {regime.label}
        </div>
      </div>

      {/* KPI 2: Time Dilation */}
      <div className="rounded-lg border border-slate-800 bg-[#111827] p-4">
        <div className="text-[11px] font-medium tracking-wider uppercase text-slate-400">
          Dilatación Temporal (Δt / Δt₀)
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="font-mono text-2xl font-semibold text-cyan-300 tabular-nums">
            {metrics.dilatedHalfTickNs.toFixed(2)}
          </span>
          <span className="font-mono text-xs text-slate-400">
            ns vs {metrics.properHalfTickNs.toFixed(2)} ns
          </span>
        </div>
        <div className="mt-2 font-mono text-xs text-slate-400 tabular-nums">
          Ritmo del reloj móvil: {metrics.clockRatePercent.toFixed(1)}%
        </div>
      </div>

      {/* KPI 3: Length Contraction */}
      <div className="rounded-lg border border-slate-800 bg-[#111827] p-4">
        <div className="text-[11px] font-medium tracking-wider uppercase text-slate-400">
          Contracción Espacial (L)
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="font-mono text-2xl font-semibold text-amber-300 tabular-nums">
            {metrics.contractedLengthM.toFixed(2)}
          </span>
          <span className="font-mono text-xs text-slate-400">
            m de {params.properLengthM.toFixed(0)} m
          </span>
        </div>
        <div className="mt-2 font-mono text-xs text-slate-400 tabular-nums">
          Acortamiento longitudinal: -{metrics.contractionPercent.toFixed(1)}%
        </div>
      </div>

      {/* KPI 4: Relative Speed */}
      <div className="rounded-lg border border-slate-800 bg-[#111827] p-4">
        <div className="text-[11px] font-medium tracking-wider uppercase text-slate-400">
          Velocidad Relativa (v)
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="font-mono text-2xl font-semibold text-slate-50 tabular-nums">
            {metrics.beta.toFixed(3)} c
          </span>
          <span className="font-mono text-xs text-slate-400">
            ({Math.round(metrics.velocityKmS).toLocaleString('es-ES')} km/s)
          </span>
        </div>
        <div className="mt-2 font-mono text-xs text-slate-400 tabular-nums">
          Camino del fotón móvil: {metrics.photonDiagonalPathM.toFixed(2)} m
        </div>
      </div>
    </section>
  );
}
