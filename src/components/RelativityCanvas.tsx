import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  RelativityMetrics,
  SPEED_OF_LIGHT_M_NS,
  SimulationParams,
} from '../physics/relativity';

export interface RelativityCanvasHandle {
  resetClocks: () => void;
  stepHalfTick: () => void;
}

interface RelativityCanvasProps {
  params: SimulationParams;
  metrics: RelativityMetrics;
  isPlaying: boolean;
}

interface TrailPoint {
  x: number;
  y: number;
  passId: number;
}

export const RelativityCanvas = forwardRef<RelativityCanvasHandle, RelativityCanvasProps>(
  function RelativityCanvas({ params, metrics, isPlaying }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Simulation physical elapsed time and incremental phase/position refs for smooth slider scrubbing
    const obsTimeNsRef = useRef<number>(0);
    const restPhaseRef = useRef<number>(0);
    const movPhaseRef = useRef<number>(0);
    const shipTravelPxRef = useRef<number>(0);
    const trailRef = useRef<TrailPoint[]>([]);
    const lastPassIdRef = useRef<number>(0);

    // Latest props stored in refs for 60fps animation loop without tearing down RAF
    const paramsRef = useRef(params);
    const metricsRef = useRef(metrics);
    const isPlayingRef = useRef(isPlaying);

    paramsRef.current = params;
    metricsRef.current = metrics;
    isPlayingRef.current = isPlaying;

    const [hoverCoord, setHoverCoord] = useState<{ xM: number; lane: string } | null>(null);

    useImperativeHandle(ref, () => ({
      resetClocks: () => {
        obsTimeNsRef.current = 0;
        restPhaseRef.current = 0;
        movPhaseRef.current = 0;
        shipTravelPxRef.current = 0;
        trailRef.current = [];
        lastPassIdRef.current = 0;
      },
      stepHalfTick: () => {
        const m = metricsRef.current;
        const p = paramsRef.current;
        const halfTick = m.properHalfTickNs;
        obsTimeNsRef.current += halfTick;
        restPhaseRef.current += 1;
        movPhaseRef.current += 1 / m.gamma;

        const containerEl = containerRef.current;
        const rectH = containerEl ? Math.max(460, Math.floor(containerEl.getBoundingClientRect().height)) : 580;
        const laneSplitY = Math.round(rectH * 0.44);
        const mirrorHScale = 24;
        const mirrorSeparationPx = Math.min(laneSplitY - 78, Math.max(66, p.mirrorHeightM * mirrorHScale));
        const cPxPerNs = (mirrorSeparationPx - 12) / halfTick;
        shipTravelPxRef.current += m.beta * cPxPerNs * halfTick;
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      let rafId = 0;
      let lastFrameTs = performance.now();

      const drawScene = (now: number) => {
        const dtSec = Math.min(0.05, Math.max(0, (now - lastFrameTs) / 1000));
        lastFrameTs = now;

        const p = paramsRef.current;
        const m = metricsRef.current;

        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        const width = Math.max(320, Math.floor(rect.width));
        const height = Math.max(460, Math.floor(rect.height));

        if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
          canvas.width = Math.floor(width * dpr);
          canvas.height = Math.floor(height * dpr);
        }

        const laneSplitY = Math.round(height * 0.44);
        const pxPerMeterLength = Math.min(3.0, Math.max(1.8, (width - 140) / 240));
        const mirrorHScale = 24;
        const mirrorSeparationPx = Math.min(laneSplitY - 78, Math.max(66, p.mirrorHeightM * mirrorHScale));

        const properHalfTickNs = m.properHalfTickNs;
        const dilatedHalfTickNs = m.dilatedHalfTickNs;
        const cPxPerNs = (mirrorSeparationPx - 12) / properHalfTickNs;
        const vPxPerNs = m.beta * cPxPerNs;

        // Advance physical observer time and incremental phases smoothly
        if (isPlayingRef.current) {
          const dtNs = dtSec * 9.0 * p.timeScale;
          obsTimeNsRef.current += dtNs;
          restPhaseRef.current += dtNs / properHalfTickNs;
          movPhaseRef.current += dtNs / dilatedHalfTickNs;
          shipTravelPxRef.current += vPxPerNs * dtNs;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.save();
        ctx.scale(dpr, dpr);

        // Background canvas (#07090E)
        ctx.fillStyle = '#07090E';
        ctx.fillRect(0, 0, width, height);

        // Subtle calibrated grid
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
        ctx.lineWidth = 1;
        const gridStep = 40;
        for (let gx = 0; gx < width; gx += gridStep) {
          ctx.beginPath();
          ctx.moveTo(gx + 0.5, 0);
          ctx.lineTo(gx + 0.5, height);
          ctx.stroke();
        }
        for (let gy = 0; gy < height; gy += gridStep) {
          ctx.beginPath();
          ctx.moveTo(0, gy + 0.5);
          ctx.lineTo(width, gy + 0.5);
          ctx.stroke();
        }

        // Lane divider hairline
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, laneSplitY + 0.5);
        ctx.lineTo(width, laneSplitY + 0.5);
        ctx.stroke();

        const obsTimeNs = obsTimeNsRef.current;

        // ============================================================
        // UPPER LANE: Observer's Own Rest Frame
        // ============================================================
        const isStationaryPerspective = p.frameView === 'stationary';
        const upperTitle = isStationaryPerspective
          ? 'MARCO EN REPOSO · OBSERVADOR EN TIERRA (S)'
          : "MARCO EN REPOSO · PASAJERO EN LA NAVE (S')";

        ctx.fillStyle = '#94A3B8';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(upperTitle, 20, 26);

        // Rest clock phase
        const restPhase = restPhaseRef.current;
        const restTicks = Math.floor(restPhase);
        const restFrac = restPhase - restTicks;
        const restGoingUp = restTicks % 2 === 0;
        const restPhotonNormY = restGoingUp ? 1 - restFrac : restFrac; // 1 = bottom, 0 = top

        const restClockCenterX = Math.round(width * 0.24);
        const upperMidY = Math.round((laneSplitY + 24) * 0.52);
        const upperTopMirrorY = upperMidY - mirrorSeparationPx / 2;
        const upperBottomMirrorY = upperMidY + mirrorSeparationPx / 2;

        // Reference craft / station silhouette in upper lane (proper length L0)
        const properLenPx = p.properLengthM * pxPerMeterLength;
        const upperCraftLeft = Math.round(width * 0.56 - properLenPx / 2);
        const upperCraftTop = upperMidY - 22;
        const upperCraftHeight = 44;

        drawCraftBody(
          ctx,
          upperCraftLeft,
          upperCraftTop,
          properLenPx,
          upperCraftHeight,
          isStationaryPerspective ? '#06B6D4' : '#F59E0B',
          false,
          isStationaryPerspective ? 'Estación S (Reposo)' : "Nave S' (Reposo)"
        );

        // Proper length dimension bracket above craft
        drawDimensionBracket(
          ctx,
          upperCraftLeft,
          upperCraftLeft + properLenPx,
          upperCraftTop - 14,
          `L₀ = ${p.properLengthM.toFixed(0)} m`,
          '#CBD5E1'
        );

        // Rest Light Clock assembly
        drawMirrors(ctx, restClockCenterX, upperTopMirrorY, upperBottomMirrorY, 56, '#38BDF8');

        // Vertical photon path guide
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(restClockCenterX, upperTopMirrorY + 5);
        ctx.lineTo(restClockCenterX, upperBottomMirrorY - 5);
        ctx.stroke();
        ctx.setLineDash([]);

        // Height label H
        ctx.fillStyle = '#64748B';
        ctx.font = '500 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`H = ${p.mirrorHeightM.toFixed(1)} m`, restClockCenterX - 36, upperMidY + 4);

        // Rest photon particle
        const restPhotonY =
          upperTopMirrorY + 6 + restPhotonNormY * (mirrorSeparationPx - 12);
        drawPhoton(ctx, restClockCenterX, restPhotonY, '#22D3EE');

        // Rest clock digital readout
        const restClockLabel = isStationaryPerspective ? 't (S)' : "τ (S')";
        drawClockReadout(
          ctx,
          20,
          44,
          restClockLabel,
          obsTimeNs,
          restTicks,
          '#22D3EE'
        );

        // ============================================================
        // LOWER LANE: Observed Moving Frame
        // ============================================================
        const lowerTop = laneSplitY + 1;
        const lowerHeight = height - laneSplitY;
        const lowerTitle = isStationaryPerspective
          ? "MARCO EN MOVIMIENTO · NAVE S' OBSERVADA DESDE S"
          : 'MARCO EN MOVIMIENTO · TIERRA S OBSERVADA DESDE S′';

        ctx.fillStyle = '#94A3B8';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(lowerTitle, 20, lowerTop + 26);

        // Calibrated metric ruler along bottom of lower lane
        const rulerY = height - 34;
        if (p.showRuler) {
          drawMetricRuler(ctx, width, rulerY, pxPerMeterLength);
        }

        // Moving clock phase (dilated!)
        const movPhase = movPhaseRef.current;
        const movTicks = Math.floor(movPhase);
        const movFrac = movPhase - movTicks;
        const movGoingUp = movTicks % 2 === 0;
        const movPhotonNormY = movGoingUp ? 1 - movFrac : movFrac;

        const direction = isStationaryPerspective ? 1 : -1;
        const margin = Math.max(120, properLenPx * 0.6);
        const trackSpan = width + margin * 2;

        // Raw continuous travel in px
        const rawTravelPx = shipTravelPxRef.current;
        const passId = Math.floor(rawTravelPx / trackSpan);
        const travelInPass = rawTravelPx - passId * trackSpan;

        const movingCenterX =
          direction === 1
            ? -margin + travelInPass + (m.beta === 0 ? width * 0.5 + margin : 0)
            : width + margin - travelInPass - (m.beta === 0 ? width * 0.5 + margin : 0);

        const safeMovingCenterX =
          m.beta === 0 ? Math.round(width * 0.5) : movingCenterX;

        if (passId !== lastPassIdRef.current) {
          trailRef.current = [];
          lastPassIdRef.current = passId;
        }

        const lowerMirrorHeightPx = mirrorSeparationPx;
        const lowerClockMidY = Math.round(lowerTop + lowerHeight * 0.48);
        const lowerTopMirrorY = lowerClockMidY - lowerMirrorHeightPx / 2;
        const lowerBottomMirrorY = lowerClockMidY + lowerMirrorHeightPx / 2;

        // Contracted length in px
        const contractedLenPx = m.contractedLengthM * pxPerMeterLength;

        // Ghost outline of proper length L0 (when contracted and ruler enabled)
        if (p.showRuler && m.gamma > 1.005) {
          const ghostLeft = safeMovingCenterX - properLenPx / 2;
          ctx.save();
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
          ctx.lineWidth = 1.25;
          ctx.setLineDash([5, 4]);
          ctx.strokeRect(
            ghostLeft,
            lowerClockMidY - lowerMirrorHeightPx / 2 - 14,
            properLenPx,
            lowerMirrorHeightPx + 28
          );
          ctx.restore();

          drawDimensionBracket(
            ctx,
            ghostLeft,
            ghostLeft + properLenPx,
            lowerClockMidY - lowerMirrorHeightPx / 2 - 26,
            `L₀ = ${p.properLengthM.toFixed(0)} m (reposo)`,
            '#64748B'
          );
        }

        // Contracted moving hull
        const hullLeft = safeMovingCenterX - contractedLenPx / 2;
        const hullTop = lowerClockMidY - lowerMirrorHeightPx / 2 - 10;
        const hullHeight = lowerMirrorHeightPx + 20;

        drawCraftBody(
          ctx,
          hullLeft,
          hullTop,
          contractedLenPx,
          hullHeight,
          isStationaryPerspective ? '#F59E0B' : '#06B6D4',
          true,
          isStationaryPerspective ? "Nave S'" : 'Estación S'
        );

        // Contracted length bracket below hull
        drawDimensionBracket(
          ctx,
          hullLeft,
          hullLeft + contractedLenPx,
          hullTop + hullHeight + 16,
          `L = ${m.contractedLengthM.toFixed(1)} m`,
          '#FBBF24',
          true
        );

        // Moving Light Clock mirrors
        drawMirrors(
          ctx,
          safeMovingCenterX,
          lowerTopMirrorY,
          lowerBottomMirrorY,
          Math.min(54, Math.max(26, contractedLenPx * 0.45)),
          '#F59E0B'
        );

        // Current moving photon coordinates
        const movPhotonY =
          lowerTopMirrorY + 6 + movPhotonNormY * (lowerMirrorHeightPx - 12);

        // Record trail point
        if (p.showTrail && m.beta > 0) {
          const pts = trailRef.current;
          const lastPt = pts[pts.length - 1];
          if (
            !lastPt ||
            Math.hypot(safeMovingCenterX - lastPt.x, movPhotonY - lastPt.y) > 2.5
          ) {
            pts.push({ x: safeMovingCenterX, y: movPhotonY, passId });
            if (pts.length > 520) {
              pts.shift();
            }
          }
        } else if (!p.showTrail) {
          trailRef.current = [];
        }

        // Draw sawtooth light trail
        if (p.showTrail && trailRef.current.length > 1) {
          ctx.save();
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)';
          ctx.lineWidth = 1.75;
          ctx.beginPath();
          for (let i = 0; i < trailRef.current.length; i++) {
            const pt = trailRef.current[i];
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();
          ctx.restore();
        }

        // Draw Pythagorean Right Triangle overlay on current active half-bounce
        if (p.showTriangle && m.beta > 0.01) {
          const elapsedInHalfBounceNs = movFrac * dilatedHalfTickNs;
          const halfBounceHorizPx = direction * vPxPerNs * elapsedInHalfBounceNs;
          const bounceStartX = safeMovingCenterX - halfBounceHorizPx;
          const bounceStartY = movGoingUp
            ? lowerBottomMirrorY - 6
            : lowerTopMirrorY + 6;

          ctx.save();
          // Shaded triangle fill
          ctx.fillStyle = 'rgba(6, 182, 212, 0.09)';
          ctx.beginPath();
          ctx.moveTo(bounceStartX, bounceStartY);
          ctx.lineTo(safeMovingCenterX, bounceStartY);
          ctx.lineTo(safeMovingCenterX, movPhotonY);
          ctx.closePath();
          ctx.fill();

          // Horizontal leg: v * dt
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(bounceStartX, bounceStartY);
          ctx.lineTo(safeMovingCenterX, bounceStartY);
          ctx.stroke();

          // Vertical leg: H
          ctx.strokeStyle = '#94A3B8';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(safeMovingCenterX, bounceStartY);
          ctx.lineTo(safeMovingCenterX, movPhotonY);
          ctx.stroke();
          ctx.setLineDash([]);

          // Hypotenuse: c * dt
          ctx.strokeStyle = '#22D3EE';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bounceStartX, bounceStartY);
          ctx.lineTo(safeMovingCenterX, movPhotonY);
          ctx.stroke();

          // Triangle leg annotations when wide enough
          if (Math.abs(halfBounceHorizPx) > 26) {
            ctx.font = '600 10px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FBBF24';
            ctx.fillText(
              'v·Δt/2',
              (bounceStartX + safeMovingCenterX) / 2,
              movGoingUp ? bounceStartY + 13 : bounceStartY - 6
            );
            ctx.fillStyle = '#22D3EE';
            ctx.fillText(
              'c·Δt/2',
              (bounceStartX + safeMovingCenterX) / 2 - direction * 18,
              (bounceStartY + movPhotonY) / 2
            );
          }
          ctx.restore();
        }

        // Moving photon
        drawPhoton(ctx, safeMovingCenterX, movPhotonY, '#22D3EE');

        // Velocity vector arrow
        if (m.beta > 0) {
          const arrowStartX =
            direction === 1 ? hullLeft + contractedLenPx + 10 : hullLeft - 10;
          const arrowLen = direction * (20 + m.beta * 42);
          drawVelocityArrow(
            ctx,
            arrowStartX,
            lowerClockMidY,
            arrowStartX + arrowLen,
            lowerClockMidY,
            `${m.beta.toFixed(3)}c`
          );
        }

        // Moving clock digital readout
        const movProperTimeNs = movPhaseRef.current * properHalfTickNs;
        const movClockLabel = isStationaryPerspective ? "τ' (S')" : 't (S)';
        drawClockReadout(
          ctx,
          20,
          lowerTop + 44,
          movClockLabel,
          movProperTimeNs,
          movTicks,
          '#FBBF24'
        );

        // Right-aligned live comparison delta in lower lane header
        ctx.textAlign = 'right';
        ctx.fillStyle = '#94A3B8';
        ctx.font = '500 11px "JetBrains Mono", monospace';
        ctx.fillText(
          `c = ${(SPEED_OF_LIGHT_M_NS * 1e9 / 1e8).toFixed(3)}×10⁸ m/s (invariante) · γ = ${m.gamma.toFixed(3)}`,
          width - 20,
          lowerTop + 26
        );

        ctx.restore();
        rafId = requestAnimationFrame(drawScene);
      };

      rafId = requestAnimationFrame(drawScene);
      return () => cancelAnimationFrame(rafId);
    }, []);

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      const pxPerMeter = Math.min(3.0, Math.max(1.8, (rect.width - 140) / 240));
      const xM = relX / pxPerMeter;
      const lane = relY < rect.height * 0.44 ? 'Marco en reposo' : 'Marco en movimiento';
      setHoverCoord({ xM, lane });
    };

    return (
      <div className="flex-1 flex flex-col rounded-lg border border-slate-800 bg-[#07090E] overflow-hidden">
        {/* Stage header bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-[#0B0E17] px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="font-medium text-slate-100">
              Experimento del Reloj de Luz
            </span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-400">
              {params.frameView === 'stationary'
                ? 'Observador estacionario en Tierra (S)'
                : "Observador a bordo de la nave (S')"}
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400 tabular-nums">
            {hoverCoord ? (
              <span>
                {hoverCoord.lane} · x = {hoverCoord.xM.toFixed(1)} m
              </span>
            ) : (
              <span>Cursor sobre escena para medir coordenada x</span>
            )}
          </div>
        </div>

        {/* Interactive 2D Canvas */}
        <div
          ref={containerRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverCoord(null)}
          className="relative w-full min-h-[490px] lg:h-[580px] cursor-crosshair select-none"
        >
          <canvas
            ref={canvasRef}
            className="block h-full w-full"
            aria-label="Simulación animada 2D de reloj de luz y contracción de longitud"
          />
        </div>
      </div>
    );
  }
);

function drawMirrors(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  bottomY: number,
  mirrorWidth: number,
  accent: string
) {
  const halfW = mirrorWidth / 2;
  ctx.save();
  ctx.fillStyle = '#1E293B';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;

  // Top mirror
  ctx.fillRect(cx - halfW, topY - 4, mirrorWidth, 6);
  ctx.beginPath();
  ctx.moveTo(cx - halfW, topY + 2);
  ctx.lineTo(cx + halfW, topY + 2);
  ctx.stroke();

  // Bottom mirror
  ctx.fillRect(cx - halfW, bottomY - 2, mirrorWidth, 6);
  ctx.beginPath();
  ctx.moveTo(cx - halfW, bottomY - 2);
  ctx.lineTo(cx + halfW, bottomY - 2);
  ctx.stroke();
  ctx.restore();
}

function drawPhoton(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
) {
  ctx.save();
  const grad = ctx.createRadialGradient(x, y, 1, x, y, 14);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  grad.addColorStop(0.35, color);
  grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(x, y, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCraftBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  strokeColor: string,
  highlightFill: boolean,
  label: string
) {
  ctx.save();
  ctx.fillStyle = highlightFill
    ? 'rgba(245, 158, 11, 0.08)'
    : 'rgba(15, 23, 42, 0.72)';
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;

  const r = 6;
  ctx.beginPath();
  ctx.roundRect(x, y, Math.max(12, w), h, r);
  ctx.fill();
  ctx.stroke();

  // End-cap bulkhead ticks
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.25)';
  ctx.lineWidth = 1;
  if (w > 32) {
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 6);
    ctx.lineTo(x + 8, y + h - 6);
    ctx.moveTo(x + w - 8, y + 6);
    ctx.lineTo(x + w - 8, y + h - 6);
    ctx.stroke();
  }

  if (w > 78) {
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '500 11px "DM Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(label, x + w - 12, y + 16);
  }
  ctx.restore();
}

function drawDimensionBracket(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
  label: string,
  color: string,
  labelBelow = false
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(x1, y - 4);
  ctx.lineTo(x1, y + 4);
  ctx.moveTo(x2, y - 4);
  ctx.lineTo(x2, y + 4);
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();

  ctx.font = '600 11px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, (x1 + x2) / 2, labelBelow ? y + 14 : y - 6);
  ctx.restore();
}

function drawClockReadout(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  timeNs: number,
  ticks: number,
  accent: string
) {
  ctx.save();
  ctx.fillStyle = '#0B0E17';
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, 166, 52, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 10px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`${label} · TICS: ${ticks}`, x + 10, y + 18);

  ctx.fillStyle = accent;
  ctx.font = '600 16px "JetBrains Mono", monospace';
  ctx.fillText(`${timeNs.toFixed(2)} ns`, x + 10, y + 40);
  ctx.restore();
}

function drawMetricRuler(
  ctx: CanvasRenderingContext2D,
  width: number,
  y: number,
  pxPerMeter: number
) {
  ctx.save();
  ctx.strokeStyle = '#334155';
  ctx.fillStyle = '#64748B';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(20, y);
  ctx.lineTo(width - 20, y);
  ctx.stroke();

  const stepM = 25;
  const stepPx = stepM * pxPerMeter;
  ctx.font = '500 10px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';

  let meter = 0;
  for (let x = 20; x <= width - 20; x += stepPx) {
    ctx.beginPath();
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x, y + 5);
    ctx.stroke();
    ctx.fillText(`${meter}m`, x, y + 17);
    meter += stepM;
  }
  ctx.restore();
}

function drawVelocityArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label: string
) {
  const dir = x2 >= x1 ? 1 : -1;
  ctx.save();
  ctx.strokeStyle = '#F59E0B';
  ctx.fillStyle = '#F59E0B';
  ctx.lineWidth = 1.75;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - dir * 7, y2 - 4);
  ctx.lineTo(x2 - dir * 7, y2 + 4);
  ctx.closePath();
  ctx.fill();

  ctx.font = '600 10px "JetBrains Mono", monospace';
  ctx.textAlign = dir === 1 ? 'left' : 'right';
  ctx.fillText(`v = ${label}`, x2 + dir * 6, y2 + 3);
  ctx.restore();
}
