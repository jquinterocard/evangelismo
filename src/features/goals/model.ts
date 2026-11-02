import type { Activity, Goal, GoalMetric, GoalPeriod, GoalStatus, QrRecord } from "@/types";
import { ACTIVITY_TYPES } from "@/types";
import { goalSchema } from "@/lib/schemas";
import { generateUuid } from "@/lib/uuid";
import { isWithin, previousRange, toISODate, type DateRange } from "@/lib/dates";
import { ACTIVITY_LABELS, sumInRange } from "@/features/activities/model";
import { computeProjection, type Projection } from "@/features/impact/projections";
import type { DailyStat } from "@/features/completions/api";

export const METRIC_LABELS: Record<GoalMetric, string> = {
  ...ACTIVITY_LABELS,
  qr_generated: "QR generados (este navegador)",
  global_completions: "Enseñanzas completadas (global)",
  global_positive: "Respuestas positivas (global)",
  global_participation: "Participación voluntaria (global)",
};

export const PERIOD_LABELS: Record<GoalPeriod, string> = {
  daily: "Diaria",
  weekly: "Semanal",
  monthly: "Mensual",
  quarterly: "Trimestral",
  yearly: "Anual",
  custom: "Personalizada",
};

export const STATUS_LABELS: Record<GoalStatus, string> = {
  upcoming: "Por iniciar",
  active: "En curso",
  achieved: "Cumplida",
  ended: "Finalizada",
};

export function isGlobalMetric(m: GoalMetric): m is "global_completions" | "global_positive" | "global_participation" {
  return m === "global_completions" || m === "global_positive" || m === "global_participation";
}

export interface MetricSources {
  activities: Activity[];
  qrHistory: QrRecord[];
  /** Estadísticas diarias globales (Supabase) que cubran el rango, o null si no están disponibles. */
  global: DailyStat[] | null;
}

/** Valor actual de un indicador en un rango; null si es global y no hay datos disponibles. */
export function metricValue(metric: GoalMetric, range: DateRange, src: MetricSources): number | null {
  if ((ACTIVITY_TYPES as readonly string[]).includes(metric)) {
    return sumInRange(src.activities, metric as (typeof ACTIVITY_TYPES)[number], range);
  }
  if (metric === "qr_generated") {
    return src.qrHistory.filter((q) => isWithin(toISODate(new Date(q.createdAt)), range.start, range.end)).length;
  }
  if (!src.global) return null;
  let s = 0;
  for (const d of src.global) {
    if (!isWithin(d.day, range.start, range.end)) continue;
    if (metric === "global_completions") s += d.completions;
    else if (metric === "global_positive") s += d.positive;
    else s += d.positive + d.negative + d.skipped;
  }
  return s;
}

export function goalStatus(goal: Goal, current: number, today: string): GoalStatus {
  if (current >= goal.target) return "achieved";
  if (today < goal.startDate) return "upcoming";
  if (today > goal.endDate) return "ended";
  return "active";
}

export interface GoalProgress {
  goal: Goal;
  current: number | null;
  previous: number | null;
  status: GoalStatus | null;
  projection: Projection | null;
}

export function goalProgress(goal: Goal, src: MetricSources, today: string): GoalProgress {
  const range = { start: goal.startDate, end: goal.endDate };
  const current = metricValue(goal.metric, range, src);
  const previous = metricValue(goal.metric, previousRange(range), src);
  if (current === null) return { goal, current, previous, status: null, projection: null };
  return {
    goal,
    current,
    previous,
    status: goalStatus(goal, current, today),
    projection: computeProjection({ total: current, target: goal.target, start: goal.startDate, end: goal.endDate, today }),
  };
}

export interface GoalInput {
  name: string;
  description?: string;
  metric: GoalMetric;
  target: number;
  period: GoalPeriod;
  startDate: string;
  endDate: string;
}

export function buildGoal(input: GoalInput, existing?: Goal, now = new Date()) {
  const ts = now.toISOString();
  const r = goalSchema.safeParse({
    ...input,
    id: existing?.id ?? generateUuid(),
    createdAt: existing?.createdAt ?? ts,
    updatedAt: ts,
  });
  if (!r.success) {
    const errors: Record<string, string> = {};
    for (const i of r.error.issues) {
      const k = String(i.path[0] ?? "form");
      if (!errors[k]) errors[k] = i.message;
    }
    if (errors.target) errors.target = "Escribe una cantidad objetivo entera mayor que cero.";
    return { ok: false as const, errors };
  }
  return { ok: true as const, value: r.data as Goal };
}
