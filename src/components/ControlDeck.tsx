import { Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import {
  PHYSICS_PRESETS,
  RelativityMetrics,
  SimulationParams,
  clampBeta,
} from '../physics/relativity';

interface ControlDeckProps {
  params: SimulationParams;
  metrics: RelativityMetrics;
  isPlaying: boolean;
  onUpdateParams: (patch: Partial<SimulationParams>) => void;
  onTogglePlay: () => void;
  onStepHalfTick: () => void;
  onResetClocks: () => void;
}

export function ControlDeck({
  params,
  metrics,
  isPlaying,
  onUpdateParams,
  onTogglePlay,
  onStepHalfTick,
  onResetClocks,
}: ControlDeckProps) {
  const adjustBeta = (delta: number) => {
    const next = clampBeta(Number((params.beta + delta).toFixed(4)));
    onUpdateParams({ beta: next });
  };

  return (
    <aside
      aria-label="Panel de parámetros relativistas"
      className="flex flex-col justify-between rounded-lg border border-slate-800 bg-[#111827] p-5 lg:w-[360px] xl:w-[380px] shrink-0"
    >
      <div className="space-y-6">
        {/* Reference frame perspective switcher */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium tracking-wider uppercase text-slate-400">
              Marco de Referencia
            </span>
            <span className="font-mono text-xs text-slate-400 tabular-nums">
              {params.frameView === 'stationary' ? 'Perspectiva S' : "Perspectiva S'"}
            </span>
          </div>
          <div
            role="group"
            aria-label="Seleccionar marco de referencia"
            className="grid grid-cols-2 gap-1 rounded-md border border-slate-800 bg-[#0B0E17] p-1"
          >
            <button
              type="button"
              onClick={() => onUpdateParams({ frameView: 'stationary' })}
              className={`rounded px-3 py-2 text-xs font-medium transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                params.frameView === 'stationary'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Tierra (S)
            </button>
            <button
              type="button"
              onClick={() => onUpdateParams({ frameView: 'moving' })}
              className={`rounded px-3 py-2 text-xs font-medium transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                params.frameView === 'moving'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Nave (S&apos;)
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            {params.frameView === 'stationary'
              ? 'Observas desde la estación fija S: la nave S′ viaja hacia la derecha, se contrae y su reloj atrasa.'
              : 'Viajas dentro de la nave S′: tu longitud L₀ y tu reloj son normales; la estación S retrocede y se contrae.'}
          </p>
        </div>

        <hr className="border-slate-800/80" />

        {/* Velocity parameter */}
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <label
              htmlFor="beta-slider"
              className="text-sm font-medium text-slate-200"
            >
              Velocidad relativa (β = v/c)
            </label>
            <span className="font-mono text-base font-semibold text-cyan-300 tabular-nums">
              {metrics.beta.toFixed(3)} c
            </span>
          </div>

          <input
            id="beta-slider"
            type="range"
            min={0}
            max={0.995}
            step={0.001}
            value={params.beta}
            onChange={(e) => onUpdateParams({ beta: Number(e.target.value) })}
            className="lab-slider"
          />

          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
            <span>0.000c</span>
            <span>{Math.round(metrics.velocityKmS).toLocaleString('es-ES')} km/s</span>
            <span>0.995c</span>
          </div>

          <div className="mt-2.5 grid grid-cols-4 gap-1.5">
            {[
              { label: '-0.01c', delta: -0.01 },
              { label: '-0.001c', delta: -0.001 },
              { label: '+0.001c', delta: 0.001 },
              { label: '+0.01c', delta: 0.01 },
            ].map((step) => (
              <button
                key={step.label}
                type="button"
                onClick={() => adjustBeta(step.delta)}
                className="rounded border border-slate-800 bg-[#0B0E17] py-1.5 font-mono text-[11px] text-slate-300 hover:border-slate-600 hover:text-white transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                {step.label}
              </button>
            ))}
          </div>
        </div>

        {/* Proper length parameter */}
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <label
              htmlFor="length-slider"
              className="text-sm font-medium text-slate-200"
            >
              Longitud propia (L₀)
            </label>
            <span className="font-mono text-sm font-semibold text-slate-100 tabular-nums">
              {params.properLengthM.toFixed(0)} m
              <span className="text-slate-500 mx-1">→</span>
              <span className="text-amber-300">{metrics.contractedLengthM.toFixed(1)} m</span>
            </span>
          </div>
          <input
            id="length-slider"
            type="range"
            min={20}
            max={200}
            step={5}
            value={params.properLengthM}
            onChange={(e) => onUpdateParams({ properLengthM: Number(e.target.value) })}
            className="lab-slider"
          />
          <div className="mt-1 flex justify-between font-mono text-[11px] text-slate-500 tabular-nums">
            <span>20 m</span>
            <span>En reposo vs. medida</span>
            <span>200 m</span>
          </div>
        </div>

        {/* Mirror height & visual playback speed */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label
                htmlFor="height-slider"
                className="text-xs font-medium text-slate-300"
              >
                Espejos (H)
              </label>
              <span className="font-mono text-xs font-semibold text-slate-100 tabular-nums">
                {params.mirrorHeightM.toFixed(1)} m
              </span>
            </div>
            <input
              id="height-slider"
              type="range"
              min={1.5}
              max={6.0}
              step={0.1}
              value={params.mirrorHeightM}
              onChange={(e) => onUpdateParams({ mirrorHeightM: Number(e.target.value) })}
              className="lab-slider"
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label
                htmlFor="speed-slider"
                className="text-xs font-medium text-slate-300"
              >
                Cámara lenta
              </label>
              <span className="font-mono text-xs font-semibold text-slate-100 tabular-nums">
                {params.timeScale.toFixed(2)}×
              </span>
            </div>
            <input
              id="speed-slider"
              type="range"
              min={0.25}
              max={2.0}
              step={0.05}
              value={params.timeScale}
              onChange={(e) => onUpdateParams({ timeScale: Number(e.target.value) })}
              className="lab-slider"
            />
          </div>
        </div>

        <hr className="border-slate-800/80" />

        {/* Physics presets */}
        <div>
          <span className="block text-xs font-medium tracking-wider uppercase text-slate-400 mb-2.5">
            Escenarios Calibrados
          </span>
          <div className="grid grid-cols-2 gap-2">
            {PHYSICS_PRESETS.map((preset) => {
              const isActive = Math.abs(params.beta - preset.beta) < 0.0015;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onUpdateParams({ beta: preset.beta })}
                  title={preset.description}
                  className={`flex flex-col items-start rounded-md border px-2.5 py-2 text-left transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                    isActive
                      ? 'border-cyan-500/60 bg-cyan-500/10 text-slate-100'
                      : 'border-slate-800 bg-[#0B0E17] text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-medium leading-tight truncate w-full">
                    {preset.label}
                  </span>
                  <span className="mt-0.5 font-mono text-[11px] text-cyan-400 tabular-nums">
                    {preset.betaLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visual layer toggles */}
        <div>
          <span className="block text-xs font-medium tracking-wider uppercase text-slate-400 mb-2">
            Capas Geométricas
          </span>
          <div className="space-y-2">
            {[
              {
                key: 'showTriangle' as const,
                label: 'Triángulo pitagórico (c·Δt/2)',
                checked: params.showTriangle,
              },
              {
                key: 'showTrail' as const,
                label: 'Estela de trayectoria del fotón',
                checked: params.showTrail,
              },
              {
                key: 'showRuler' as const,
                label: 'Regla métrica y silueta L₀',
                checked: params.showRuler,
              },
            ].map((toggle) => (
              <label
                key={toggle.key}
                className="flex items-center justify-between gap-3 rounded-md border border-slate-800/80 bg-[#0B0E17] px-3 py-2 text-xs text-slate-200 cursor-pointer hover:border-slate-700 transition-colors"
              >
                <span>{toggle.label}</span>
                <input
                  type="checkbox"
                  checked={toggle.checked}
                  onChange={(e) => onUpdateParams({ [toggle.key]: e.target.checked })}
                  className="h-4 w-4 accent-cyan-500 rounded cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Playback controls */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2">
        <button
          type="button"
          onClick={onTogglePlay}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        >
          {isPlaying ? (
            <>
              <Pause className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Pausar</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reanudar</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onStepHalfTick}
          title="Avanzar exactamente un semiciclo propio (1 rebote)"
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-700 bg-[#0B0E17] px-3 py-2.5 text-xs font-medium text-slate-200 hover:border-slate-500 hover:text-white transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400"
        >
          <StepForward className="h-3.5 w-3.5" aria-hidden="true" />
          <span>+1 Tic</span>
        </button>

        <button
          type="button"
          onClick={onResetClocks}
          title="Sincronizar ambos cronómetros a t = 0"
          className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-[#0B0E17] p-2.5 text-slate-300 hover:border-slate-500 hover:text-white transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400"
          aria-label="Sincronizar relojes a cero"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
