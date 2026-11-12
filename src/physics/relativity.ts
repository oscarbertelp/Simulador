export type ReferenceFrame = 'stationary' | 'moving';

export interface SimulationParams {
  beta: number; // v / c, range [0, 0.995]
  properLengthM: number; // L0 in meters [20, 200]
  mirrorHeightM: number; // H in meters [1.5, 6.0]
  timeScale: number; // Visual playback multiplier [0.25, 2.0]
  frameView: ReferenceFrame; // Observer perspective: S (Earth) or S' (Spacecraft)
  showTriangle: boolean; // Pythagorean light clock triangle overlay
  showTrail: boolean; // Photon sawtooth trajectory trail
  showRuler: boolean; // Calibrated metric reference grid
}

export interface RelativityMetrics {
  beta: number;
  gamma: number;
  inverseGamma: number;
  velocityKmS: number;
  properHalfTickNs: number; // tau_0 = H / c
  properFullTickNs: number; // 2 * H / c
  dilatedHalfTickNs: number; // dt = gamma * tau_0
  dilatedFullTickNs: number; // 2 * gamma * tau_0
  contractedLengthM: number; // L = L0 / gamma
  contractionPercent: number; // (1 - 1/gamma) * 100
  clockRatePercent: number; // (1 / gamma) * 100
  photonDiagonalPathM: number; // c * dt = gamma * H
  horizontalTravelM: number; // v * dt = beta * gamma * H
}

export interface PhysicsPreset {
  id: string;
  label: string;
  betaLabel: string;
  beta: number;
  description: string;
}

export const SPEED_OF_LIGHT_M_S = 299_792_458;
export const SPEED_OF_LIGHT_KM_S = 299_792.458;
export const SPEED_OF_LIGHT_M_NS = 0.299792458;

export const DEFAULT_PARAMS: SimulationParams = {
  beta: 0.6,
  properLengthM: 120,
  mirrorHeightM: 3.0,
  timeScale: 1.0,
  frameView: 'stationary',
  showTriangle: true,
  showTrail: true,
  showRuler: true,
};

export const PHYSICS_PRESETS: PhysicsPreset[] = [
  {
    id: 'rest',
    label: 'Reposo clásico',
    betaLabel: '0.000c',
    beta: 0,
    description: 'Ambos relojes sincronizados y longitud sin contracción.',
  },
  {
    id: 'parker',
    label: 'Sonda Parker',
    betaLabel: '0.00064c',
    beta: 0.00064,
    description: 'Objeto humano más rápido (~192 km/s); efectos aún imperceptibles.',
  },
  {
    id: 'half-c',
    label: 'Régimen 0.50c',
    betaLabel: '0.500c',
    beta: 0.5,
    description: 'Inicio claro de asimetría temporal y espacial (γ = 1.155).',
  },
  {
    id: 'pythagorean',
    label: 'Triángulo 3-4-5',
    betaLabel: '0.600c',
    beta: 0.6,
    description: 'Referencia exacta: γ = 1.250, contracción exacta del 20.0%.',
  },
  {
    id: 'gamma-two',
    label: 'Factor γ = 2',
    betaLabel: '0.866c',
    beta: 0.866025,
    description: 'El reloj móvil late a mitad de ritmo y la longitud se reduce al 50%.',
  },
  {
    id: 'muon',
    label: 'Muón atmosférico',
    betaLabel: '0.994c',
    beta: 0.994,
    description: 'Rayos cósmicos que alcanzan el suelo gracias a γ ≈ 9.14.',
  },
];

export function clampBeta(beta: number): number {
  if (!Number.isFinite(beta)) return 0;
  return Math.min(0.995, Math.max(0, beta));
}

export function computeLorentzFactor(beta: number): number {
  const safeBeta = clampBeta(beta);
  if (safeBeta === 0) return 1;
  return 1 / Math.sqrt(1 - safeBeta * safeBeta);
}

export function computeRelativityMetrics(params: SimulationParams): RelativityMetrics {
  const beta = clampBeta(params.beta);
  const gamma = computeLorentzFactor(beta);
  const inverseGamma = 1 / gamma;
  const velocityKmS = beta * SPEED_OF_LIGHT_KM_S;

  const properHalfTickNs = params.mirrorHeightM / SPEED_OF_LIGHT_M_NS;
  const properFullTickNs = properHalfTickNs * 2;
  const dilatedHalfTickNs = properHalfTickNs * gamma;
  const dilatedFullTickNs = properFullTickNs * gamma;

  const contractedLengthM = params.properLengthM * inverseGamma;
  const contractionPercent = (1 - inverseGamma) * 100;
  const clockRatePercent = inverseGamma * 100;

  const photonDiagonalPathM = params.mirrorHeightM * gamma;
  const horizontalTravelM = beta * photonDiagonalPathM;

  return {
    beta,
    gamma,
    inverseGamma,
    velocityKmS,
    properHalfTickNs,
    properFullTickNs,
    dilatedHalfTickNs,
    dilatedFullTickNs,
    contractedLengthM,
    contractionPercent,
    clockRatePercent,
    photonDiagonalPathM,
    horizontalTravelM,
  };
}

export function getRegimeClassification(gamma: number): {
  glyph: string;
  label: string;
  toneClass: string;
} {
  if (gamma < 1.05) {
    return {
      glyph: '●',
      label: 'Clásico / Nominal',
      toneClass: 'text-emerald-400',
    };
  }
  if (gamma < 3.0) {
    return {
      glyph: '▲',
      label: 'Régimen Relativista',
      toneClass: 'text-cyan-400',
    };
  }
  return {
    glyph: '◆',
    label: 'Relativista Extremo',
    toneClass: 'text-amber-400',
  };
}

export function readParamsFromUrl(): Partial<SimulationParams> {
  if (typeof window === 'undefined') return {};
  const search = new URLSearchParams(window.location.search);
  const partial: Partial<SimulationParams> = {};

  const betaRaw = search.get('beta');
  if (betaRaw !== null) {
    const parsed = Number.parseFloat(betaRaw);
    if (Number.isFinite(parsed)) {
      partial.beta = clampBeta(parsed);
    }
  }

  const l0Raw = search.get('L0');
  if (l0Raw !== null) {
    const parsed = Number.parseFloat(l0Raw);
    if (Number.isFinite(parsed)) {
      partial.properLengthM = Math.min(200, Math.max(20, parsed));
    }
  }

  const hRaw = search.get('H');
  if (hRaw !== null) {
    const parsed = Number.parseFloat(hRaw);
    if (Number.isFinite(parsed)) {
      partial.mirrorHeightM = Math.min(6, Math.max(1.5, parsed));
    }
  }

  const frameRaw = search.get('frame');
  if (frameRaw === 'stationary' || frameRaw === 'moving') {
    partial.frameView = frameRaw;
  }

  return partial;
}

export function buildShareableUrl(params: SimulationParams): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.set('beta', params.beta.toFixed(3));
  url.searchParams.set('L0', String(Math.round(params.properLengthM)));
  url.searchParams.set('H', params.mirrorHeightM.toFixed(1));
  url.searchParams.set('frame', params.frameView);
  return url.toString();
}
