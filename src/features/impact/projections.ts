/**
 * Cálculos de proyección de metas. Funciones puras, basadas solo en datos registrados.
 * Todas las proyecciones son estimaciones.
 *
 *   promedio diario   = total_registrado / dias_transcurridos
 *   proyección        = promedio_diario * dias_totales
 *   pendiente         = max(0, meta - total_registrado)
 *   ritmo necesario   = pendiente / dias_restantes
 */
import { daysInclusive } from "@/lib/dates";

export interface ProjectionInput {
  total: number;
  target: number;
  /** YYYY-MM-DD inclusive */
  start: string;
  /** YYYY-MM-DD inclusive */
  end: string;
  /** YYYY-MM-DD */
  today: string;
}

export interface Projection {
  daysTotal: number;
  daysElapsed: number;
  daysRemaining: number;
  dailyAverage: number;
  /** Valor estimado al cierre (o el valor real si el período terminó). */
  projectedTotal: number;
  pending: number;
  /** Promedio diario necesario para cumplir; null si el período terminó o no ha empezado a contar. */
  requiredPace: number | null;
  percent: number;
  ended: boolean;
  notStarted: boolean;
  /** true mientras el período esté en curso (la proyección es una estimación). */
  isEstimate: boolean;
  /** La proyección alcanza la meta. */
  onTrack: boolean;
}

function safe(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

export function computeProjection({ total, target, start, end, today }: ProjectionInput): Projection {
  const t = Math.max(0, safe(total));
  const goal = Math.max(0, safe(target));
  const daysTotal = daysInclusive(start, end);
  const notStarted = today < start;
  const ended = today > end;

  let daysElapsed: number;
  if (notStarted) daysElapsed = 0;
  else if (ended) daysElapsed = daysTotal;
  else daysElapsed = daysInclusive(start, today);
  const daysRemaining = Math.max(0, daysTotal - daysElapsed);

  const dailyAverage = daysElapsed > 0 ? t / daysElapsed : 0;
  const projectedTotal = ended ? t : daysElapsed > 0 ? dailyAverage * daysTotal : t;
  const pending = Math.max(0, goal - t);
  let requiredPace: number | null = null;
  if (!ended) requiredPace = daysRemaining > 0 ? pending / daysRemaining : pending > 0 ? null : 0;
  if (notStarted) requiredPace = daysTotal > 0 ? pending / daysTotal : null;

  const percent = goal > 0 ? (t / goal) * 100 : 0;

  return {
    daysTotal,
    daysElapsed,
    daysRemaining,
    dailyAverage,
    projectedTotal,
    pending,
    requiredPace,
    percent,
    ended,
    notStarted,
    isEstimate: !ended,
    onTrack: goal > 0 ? projectedTotal >= goal : false,
  };
}

/** Variación porcentual entre períodos; null si no hay base de comparación. */
export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(previous) || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

/** Tasa de interés positivo = positivas / (positivas + negativas) × 100; null = sin datos suficientes. */
export function positiveInterestRate(positive: number, negative: number): number | null {
  const den = positive + negative;
  if (!Number.isFinite(den) || den <= 0) return null;
  return (positive / den) * 100;
}

const nf1 = new Intl.NumberFormat("es", { maximumFractionDigits: 1, minimumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("es", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
const nf0 = new Intl.NumberFormat("es", { maximumFractionDigits: 0 });

export const fmt = {
  int: (n: number) => nf0.format(Math.round(n)),
  dec: (n: number) => nf2.format(n),
  pct: (n: number) => `${nf1.format(n)} %`,
};
