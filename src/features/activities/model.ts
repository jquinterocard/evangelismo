import type { Activity, ActivityType } from "@/types";
import { ACTIVITY_TYPES } from "@/types";
import { activitySchema } from "@/lib/schemas";
import { generateUuid } from "@/lib/uuid";
import { eachDay, isWithin, type DateRange } from "@/lib/dates";

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  qr_shared: "QR compartidos",
  teaching_shared: "Enseñanzas compartidas",
  visit_reported: "Visitas reportadas",
  interested_reported: "Personas interesadas",
  faith_decision_reported: "Decisiones de fe reportadas",
};

export const ACTIVITY_HINTS: Record<ActivityType, string> = {
  qr_shared: "Códigos QR entregados o colocados.",
  teaching_shared: "Enseñanzas enviadas o compartidas en persona.",
  visit_reported: "Visitas que te reportaron. Una visita no es una conversión.",
  interested_reported: "Personas que expresaron interés por iniciativa propia.",
  faith_decision_reported: "Solo cuando la persona lo comunicó voluntariamente.",
};

export const ACTIVITY_COLORS: Record<ActivityType, string> = {
  qr_shared: "#25476A",
  teaching_shared: "#D8B56A",
  visit_reported: "#7DAE92",
  interested_reported: "#C77C8A",
  faith_decision_reported: "#6E8FB5",
};

export interface ActivityInput {
  date: string;
  type: ActivityType;
  quantity: number;
  description?: string;
  notes?: string;
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; errors: Record<string, string> };

function issuesToErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const i of issues) {
    const k = String(i.path[0] ?? "form");
    if (!errors[k]) errors[k] = i.message;
  }
  return errors;
}

export function buildActivity(input: ActivityInput, existing?: Activity, now = new Date()): ParseResult<Activity> {
  const ts = now.toISOString();
  const candidate = {
    id: existing?.id ?? generateUuid(),
    date: input.date,
    type: input.type,
    quantity: input.quantity,
    description: input.description,
    notes: input.notes,
    createdAt: existing?.createdAt ?? ts,
    updatedAt: ts,
  };
  const r = activitySchema.safeParse(candidate);
  if (!r.success) {
    const errors = issuesToErrors(r.error.issues);
    if (errors.quantity) errors.quantity = "Escribe un número entero entre 1 y 100 000.";
    return { ok: false, errors };
  }
  return { ok: true, value: r.data };
}

export interface ActivityFilter {
  from?: string;
  to?: string;
  type?: ActivityType | "all";
}

export function filterActivities(list: Activity[], f: ActivityFilter): Activity[] {
  return list
    .filter((a) => (!f.from || a.date >= f.from) && (!f.to || a.date <= f.to) && (!f.type || f.type === "all" || a.type === f.type))
    .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)));
}

export type Totals = Record<ActivityType, number>;

export function emptyTotals(): Totals {
  return Object.fromEntries(ACTIVITY_TYPES.map((t) => [t, 0])) as Totals;
}

export function totalsInRange(list: Activity[], range?: DateRange): Totals {
  const t = emptyTotals();
  for (const a of list) if (!range || isWithin(a.date, range.start, range.end)) t[a.type] += a.quantity;
  return t;
}

export function sumInRange(list: Activity[], type: ActivityType, range: DateRange): number {
  let s = 0;
  for (const a of list) if (a.type === type && isWithin(a.date, range.start, range.end)) s += a.quantity;
  return s;
}

export type DailyRow = { date: string } & Totals;

export function dailySeries(list: Activity[], range: DateRange): DailyRow[] {
  const rows = new Map<string, DailyRow>(eachDay(range.start, range.end).map((d) => [d, { date: d, ...emptyTotals() }]));
  for (const a of list) {
    const row = rows.get(a.date);
    if (row) row[a.type] += a.quantity;
  }
  return [...rows.values()];
}
