import { useMemo, useState } from 'react';
import { clampBeta, computeLorentzFactor } from '../physics/relativity';

interface LorentzChartsProps {
  beta: number;
  onSelectBeta: (beta: number) => void;
}

const CHART_WIDTH = 520;
const CHART_HEIGHT = 240;
const PAD = { top: 20, right: 20, bottom: 38, left: 48 };
const PLOT_W = CHART_WIDTH - PAD.left - PAD.right;
const PLOT_H = CHART_HEIGHT - PAD.top - PAD.bottom;

const MAX_BETA = 0.995;
const MAX_GAMMA = 10.5;

export function LorentzCharts({ beta, onSelectBeta }: LorentzChartsProps) {
  const [hoverBeta, setHoverBeta] = useState<number | null>(null);

  const activeBeta = hoverBeta ?? beta;
  const activeGamma = computeLorentzFactor(activeBeta);
  const activeInverse = 1 / activeGamma;

  const { gammaPath, contractionPath } = useMemo(() => {
    const steps = 160;
    const gammaPts: string[] = [];
    const invPts: string[] = [];

    for (let i = 0; i <= steps; i++) {
      const b = (i / steps) * MAX_BETA;
      const g = computeLorentzFactor(b);
      const inv = 1 / g;

      const x = PAD.left + (b / MAX_BETA) * PLOT_W;
      const yGamma = PAD.top + (1 - Math.min(g, MAX_GAMMA) / MAX_GAMMA) * PLOT_H;
      const yInv = PAD.top + (1 - inv) * PLOT_H;

      gammaPts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${yGamma.toFixed(2)}`);
      invPts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${yInv.toFixed(2)}`);
    }

    return {
      gammaPath: gammaPts.join(' '),
      contractionPath: invPts.join(' '),
    };
  }, []);

  const mapPointerToBeta = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * CHART_WIDTH;
    const norm = (svgX - PAD.left) / PLOT_W;
    return clampBeta(Number((norm * MAX_BETA).toFixed(3)));
  };

  const currentX = PAD.left + (beta / MAX_BETA) * PLOT_W;
  const currentGamma = computeLorentzFactor(beta);
  const currentGammaY =
    PAD.top + (1 - Math.min(currentGamma, MAX_GAMMA) / MAX_GAMMA) * PLOT_H;
  const currentInvY = PAD.top + (1 - 1 / currentGamma) * PLOT_H;

  const probeX = PAD.left + (activeBeta / MAX_BETA) * PLOT_W;
  const probeGammaY =
    PAD.top + (1 - Math.min(activeGamma, MAX_GAMMA) / MAX_GAMMA) * PLOT_H;
  const probeInvY = PAD.top + (1 - activeInverse) * PLOT_H;

  return (
    <section
      id="curvas"
      aria-label="Gráficas relativistas interactivas"
      className="space-y-4 scroll-mt-20"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-50">
            Curvas del Factor de Lorentz y Contracción en Vivo
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Desliza el cursor sobre cualquier gráfica para inspeccionar valores exactos o haz clic para fijar la velocidad β.
          </p>
        </div>

        <div className="font-mono text-xs text-slate-300 tabular-nums">
          Sonda: β = {activeBeta.toFixed(3)}c · γ = {activeGamma.toFixed(3)} · L/L₀ ={' '}
          {(activeInverse * 100).toFixed(1)}%
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Gamma vs Beta */}
        <div className="rounded-lg border border-slate-800 bg-[#111827] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-100">
              Factor de Lorentz γ(β) = 1 / √(1 − β²)
            </h3>
            <span className="font-mono text-xs text-cyan-300 tabular-nums">
              γ = {currentGamma.toFixed(3)}
            </span>
          </div>

          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="w-full h-auto cursor-crosshair select-none"
            onPointerMove={(e) => setHoverBeta(mapPointerToBeta(e))}
            onPointerLeave={() => setHoverBeta(null)}
            onClick={(e) => onSelectBeta(mapPointerToBeta(e))}
            role="img"
            aria-label="Gráfica interactiva del factor de Lorentz gamma en función de la velocidad relativa beta"
          >
            {/* Horizontal grid lines */}
            {[1, 2, 5, 10].map((val) => {
              const y = PAD.top + (1 - val / MAX_GAMMA) * PLOT_H;
              return (
                <g key={val}>
                  <line
                    x1={PAD.left}
                    y1={y}
                    x2={CHART_WIDTH - PAD.right}
                    y2={y}
                    stroke="#1E293B"
                    strokeDasharray={val === 1 ? undefined : '4 4'}
                  />
                  <text
                    x={PAD.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-400 font-mono text-[10px]"
                  >
                    {val}×
                  </text>
                </g>
              );
            })}

            {/* Vertical grid lines */}
            {[0, 0.25, 0.5, 0.75, 0.995].map((bVal) => {
              const x = PAD.left + (bVal / MAX_BETA) * PLOT_W;
              return (
                <g key={bVal}>
                  <line
                    x1={x}
                    y1={PAD.top}
                    x2={x}
                    y2={CHART_HEIGHT - PAD.bottom}
                    stroke="#1E293B"
                  />
                  <text
                    x={x}
                    y={CHART_HEIGHT - PAD.bottom + 16}
                    textAnchor="middle"
                    className="fill-slate-400 font-mono text-[10px]"
                  >
                    {bVal.toFixed(2)}c
                  </text>
                </g>
              );
            })}

            {/* Asymptote marker at c */}
            <line
              x1={PAD.left + PLOT_W}
              y1={PAD.top}
              x2={PAD.left + PLOT_W}
              y2={CHART_HEIGHT - PAD.bottom}
              stroke="#EF4444"
              strokeOpacity="0.45"
              strokeDasharray="3 3"
            />

            {/* Gamma curve */}
            <path
              d={gammaPath}
              fill="none"
              stroke="#06B6D4"
              strokeWidth="2.25"
            />

            {/* Probe crosshair */}
            <line
              x1={probeX}
              y1={PAD.top}
              x2={probeX}
              y2={CHART_HEIGHT - PAD.bottom}
              stroke="#475569"
              strokeDasharray="3 3"
            />
            <circle
              cx={probeX}
              cy={probeGammaY}
              r={4}
              fill="#07090E"
              stroke="#22D3EE"
              strokeWidth="2"
            />

            {/* Current operating point */}
            <circle
              cx={currentX}
              cy={currentGammaY}
              r={5.5}
              fill="#06B6D4"
              stroke="#07090E"
              strokeWidth="2"
            />

            {/* Axis labels */}
            <text
              x={PAD.left + PLOT_W / 2}
              y={CHART_HEIGHT - 4}
              textAnchor="middle"
              className="fill-slate-500 font-mono text-[10px]"
            >
              Velocidad relativa (β = v / c)
            </text>
          </svg>
        </div>

        {/* Chart 2: Contraction Ratio & Clock Rate */}
        <div className="rounded-lg border border-slate-800 bg-[#111827] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-100">
              Contracción L/L₀ y Ritmo Temporal τ/t = √(1 − β²)
            </h3>
            <span className="font-mono text-xs text-amber-300 tabular-nums">
              {(100 / currentGamma).toFixed(1)}%
            </span>
          </div>

          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="w-full h-auto cursor-crosshair select-none"
            onPointerMove={(e) => setHoverBeta(mapPointerToBeta(e))}
            onPointerLeave={() => setHoverBeta(null)}
            onClick={(e) => onSelectBeta(mapPointerToBeta(e))}
            role="img"
            aria-label="Gráfica interactiva de contracción de longitud y ritmo del reloj en función de la velocidad relativa beta"
          >
            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((val) => {
              const y = PAD.top + (1 - val) * PLOT_H;
              return (
                <g key={val}>
                  <line
                    x1={PAD.left}
                    y1={y}
                    x2={CHART_WIDTH - PAD.right}
                    y2={y}
                    stroke="#1E293B"
                    strokeDasharray={val === 0 || val === 1 ? undefined : '4 4'}
                  />
                  <text
                    x={PAD.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-400 font-mono text-[10px]"
                  >
                    {Math.round(val * 100)}%
                  </text>
                </g>
              );
            })}

            {/* Vertical grid lines */}
            {[0, 0.25, 0.5, 0.75, 0.995].map((bVal) => {
              const x = PAD.left + (bVal / MAX_BETA) * PLOT_W;
              return (
                <g key={bVal}>
                  <line
                    x1={x}
                    y1={PAD.top}
                    x2={x}
                    y2={CHART_HEIGHT - PAD.bottom}
                    stroke="#1E293B"
                  />
                  <text
                    x={x}
                    y={CHART_HEIGHT - PAD.bottom + 16}
                    textAnchor="middle"
                    className="fill-slate-400 font-mono text-[10px]"
                  >
                    {bVal.toFixed(2)}c
                  </text>
                </g>
              );
            })}

            {/* Contraction curve */}
            <path
              d={contractionPath}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2.25"
            />

            {/* Probe crosshair */}
            <line
              x1={probeX}
              y1={PAD.top}
              x2={probeX}
              y2={CHART_HEIGHT - PAD.bottom}
              stroke="#475569"
              strokeDasharray="3 3"
            />
            <circle
              cx={probeX}
              cy={probeInvY}
              r={4}
              fill="#07090E"
              stroke="#FBBF24"
              strokeWidth="2"
            />

            {/* Current operating point */}
            <circle
              cx={currentX}
              cy={currentInvY}
              r={5.5}
              fill="#F59E0B"
              stroke="#07090E"
              strokeWidth="2"
            />

            {/* Axis labels */}
            <text
              x={PAD.left + PLOT_W / 2}
              y={CHART_HEIGHT - 4}
              textAnchor="middle"
              className="fill-slate-500 font-mono text-[10px]"
            >
              Velocidad relativa (β = v / c)
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}
