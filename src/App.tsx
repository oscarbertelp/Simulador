import { useMemo, useRef, useState } from 'react';
import { ControlDeck } from './components/ControlDeck';
import { EquationsAndDeploy } from './components/EquationsAndDeploy';
import { LorentzCharts } from './components/LorentzCharts';
import {
  RelativityCanvas,
  RelativityCanvasHandle,
} from './components/RelativityCanvas';
import { TelemetryStrip } from './components/TelemetryStrip';
import { TopBar } from './components/TopBar';
import {
  DEFAULT_PARAMS,
  SimulationParams,
  computeRelativityMetrics,
  readParamsFromUrl,
} from './physics/relativity';

export default function App() {
  const [params, setParams] = useState<SimulationParams>(() => ({
    ...DEFAULT_PARAMS,
    ...readParamsFromUrl(),
  }));
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const canvasRef = useRef<RelativityCanvasHandle | null>(null);

  const metrics = useMemo(() => computeRelativityMetrics(params), [params]);

  const handleUpdateParams = (patch: Partial<SimulationParams>) => {
    setParams((prev) => ({ ...prev, ...patch }));
  };

  const handleResetAll = () => {
    setParams(DEFAULT_PARAMS);
    setIsPlaying(true);
    canvasRef.current?.resetClocks();
  };

  const handleResetClocks = () => {
    canvasRef.current?.resetClocks();
  };

  const handleStepHalfTick = () => {
    setIsPlaying(false);
    canvasRef.current?.stepHalfTick();
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col">
      <TopBar onResetAll={handleResetAll} />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-8 space-y-10">
        {/* Hero / Workspace Intro + Primary Interactive Simulator */}
        <section id="simulador" className="space-y-6 scroll-mt-20">
          <div className="max-w-3xl space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>Relatividad Especial</span>
              <span aria-hidden="true">·</span>
              <span>Reloj de Luz de Einstein</span>
              <span aria-hidden="true">·</span>
              <span>Simulación estática interactiva</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-50">
              Dilatación del Tiempo y Contracción de Longitud
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-slate-400">
              Ajusta la velocidad relativa hasta el 99.5% de la velocidad de la luz y cambia entre el observador en Tierra y el pasajero de la nave para ver cómo el espacio y el tiempo se ajustan manteniendo constante a c.
            </p>
          </div>

          {/* Two-Zone Sandbox Layout: Control Deck + 2D Stage */}
          <div className="flex flex-col lg:flex-row items-stretch gap-6">
            <ControlDeck
              params={params}
              metrics={metrics}
              isPlaying={isPlaying}
              onUpdateParams={handleUpdateParams}
              onTogglePlay={() => setIsPlaying((prev) => !prev)}
              onStepHalfTick={handleStepHalfTick}
              onResetClocks={handleResetClocks}
            />
            <RelativityCanvas
              ref={canvasRef}
              params={params}
              metrics={metrics}
              isPlaying={isPlaying}
            />
          </div>

          {/* 4-column Precision Telemetry Strip */}
          <TelemetryStrip params={params} metrics={metrics} />
        </section>

        {/* Live Interactive Lorentz Curves */}
        <LorentzCharts
          beta={params.beta}
          onSelectBeta={(nextBeta) => handleUpdateParams({ beta: nextBeta })}
        />

        {/* Dynamic Equations & Static Deployment Reference */}
        <EquationsAndDeploy params={params} metrics={metrics} />
      </main>

      <footer className="border-t border-slate-800/80 bg-[#07090E] py-6">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 text-xs text-slate-500">
          <span>LorentzLab · Laboratorio Interactivo de Relatividad Especial</span>
          <span className="font-mono">
            Compilación estática Vite + Canvas 2D + SVG · Sin dependencias de servidor
          </span>
        </div>
      </footer>
    </div>
  );
}
