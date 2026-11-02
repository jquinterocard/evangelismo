import { describe, expect, it } from "vitest";
import type { Activity, Goal } from "@/types";
import { buildActivity, dailySeries, filterActivities, totalsInRange } from "@/features/activities/model";
import { buildGoal, goalProgress, goalStatus, metricValue } from "./model";
import { periodRange } from "@/lib/dates";

const ts = "2026-11-01T00:00:00.000Z";
const mk = (date: string, type: Activity["type"], quantity: number): Activity => ({
  id: crypto.randomUUID(),
  date,
  type,
  quantity,
  createdAt: ts,
  updatedAt: ts,
});
const goal = (over: Partial<Goal> = {}): Goal => ({
  id: crypto.randomUUID(),
  name: "Meta",
  metric: "visit_reported",
  target: 100,
  period: "weekly",
  startDate: "2026-11-02",
  endDate: "2026-11-08",
  createdAt: ts,
  updatedAt: ts,
  ...over,
});

const activities = [
  mk("2026-11-02", "visit_reported", 15),
  mk("2026-11-03", "visit_reported", 15),
  mk("2026-11-04", "visit_reported", 10),
  mk("2026-11-04", "qr_shared", 7),
  mk("2026-10-28", "visit_reported", 20),
];

describe("metas", () => {
  it("valor actual derivado de las actividades del rango", () => {
    const src = { activities, qrHistory: [], global: null };
    expect(metricValue("visit_reported", { start: "2026-11-02", end: "2026-11-08" }, src)).toBe(40);
    expect(metricValue("global_completions", { start: "2026-11-02", end: "2026-11-08" }, src)).toBeNull();
  });

  it("progreso, proyección y comparación con el período anterior", () => {
    const p = goalProgress(goal(), { activities, qrHistory: [], global: null }, "2026-11-04");
    expect(p.current).toBe(40);
    expect(p.previous).toBe(20);
    expect(p.status).toBe("active");
    expect(Math.round(p.projection!.projectedTotal)).toBe(93);
  });

  it("indicadores globales con datos de Supabase", () => {
    const global = [
      { day: "2026-11-02", completions: 5, positive: 2, negative: 1, skipped: 1 },
      { day: "2026-11-03", completions: 3, positive: 1, negative: 0, skipped: 0 },
    ];
    const src = { activities: [], qrHistory: [], global };
    const r = { start: "2026-11-02", end: "2026-11-08" };
    expect(metricValue("global_completions", r, src)).toBe(8);
    expect(metricValue("global_positive", r, src)).toBe(3);
    expect(metricValue("global_participation", r, src)).toBe(5);
  });

  it("estados", () => {
    expect(goalStatus(goal(), 0, "2026-11-01")).toBe("upcoming");
    expect(goalStatus(goal(), 50, "2026-11-05")).toBe("active");
    expect(goalStatus(goal(), 100, "2026-11-05")).toBe("achieved");
    expect(goalStatus(goal(), 10, "2026-11-20")).toBe("ended");
  });

  it("valida al crear", () => {
    const base = { name: "Compartir 50 QR", metric: "qr_shared" as const, target: 50, period: "weekly" as const, ...(() => { const r = periodRange("weekly", "2026-11-04"); return { startDate: r.start, endDate: r.end }; })() };
    expect(buildGoal(base).ok).toBe(true);
    expect(buildGoal({ ...base, name: "  " }).ok).toBe(false);
    expect(buildGoal({ ...base, target: 0 }).ok).toBe(false);
    const bad = buildGoal({ ...base, startDate: "2026-11-10", endDate: "2026-11-01" });
    expect(!bad.ok && bad.errors.endDate).toBeTruthy();
  });
});

describe("actividades", () => {
  it("valida cantidad y fecha", () => {
    expect(buildActivity({ date: "2026-11-02", type: "qr_shared", quantity: 3 }).ok).toBe(true);
    expect(buildActivity({ date: "2026-02-30", type: "qr_shared", quantity: 3 }).ok).toBe(false);
    expect(buildActivity({ date: "2026-11-02", type: "qr_shared", quantity: 1.5 }).ok).toBe(false);
    expect(buildActivity({ date: "2026-11-02", type: "qr_shared", quantity: NaN }).ok).toBe(false);
  });
  it("conserva id y fecha de creación al editar", () => {
    const first = buildActivity({ date: "2026-11-02", type: "qr_shared", quantity: 3 });
    if (!first.ok) throw new Error();
    const edited = buildActivity({ date: "2026-11-03", type: "qr_shared", quantity: 4 }, first.value, new Date("2027-01-01"));
    expect(edited.ok && edited.value.id).toBe(first.value.id);
    expect(edited.ok && edited.value.createdAt).toBe(first.value.createdAt);
  });
  it("filtra por fecha y tipo, ordenado por fecha desc", () => {
    const r = filterActivities(activities, { from: "2026-11-01", type: "visit_reported" });
    expect(r.map((a) => a.date)).toEqual(["2026-11-04", "2026-11-03", "2026-11-02"]);
  });
  it("totales y serie diaria", () => {
    expect(totalsInRange(activities).visit_reported).toBe(60);
    const s = dailySeries(activities, { start: "2026-11-03", end: "2026-11-04" });
    expect(s).toHaveLength(2);
    expect(s[1].qr_shared).toBe(7);
  });
});
