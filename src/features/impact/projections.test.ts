import { describe, expect, it } from "vitest";
import { computeProjection, percentChange, positiveInterestRate } from "./projections";

describe("computeProjection", () => {
  it("reproduce el ejemplo de la especificación (meta semanal 100, 40 en 3 días)", () => {
    const p = computeProjection({ total: 40, target: 100, start: "2026-11-02", end: "2026-11-08", today: "2026-11-04" });
    expect(p.daysTotal).toBe(7);
    expect(p.daysElapsed).toBe(3);
    expect(p.dailyAverage).toBeCloseTo(13.33, 2);
    expect(Math.round(p.projectedTotal)).toBe(93);
    expect(p.pending).toBe(60);
    expect(p.daysRemaining).toBe(4);
    expect(p.requiredPace).toBe(15);
    expect(p.isEstimate).toBe(true);
    expect(p.onTrack).toBe(false);
  });

  it("sin registros no divide por cero", () => {
    const p = computeProjection({ total: 0, target: 50, start: "2026-11-02", end: "2026-11-08", today: "2026-11-02" });
    expect(p.dailyAverage).toBe(0);
    expect(p.projectedTotal).toBe(0);
    expect(p.requiredPace).toBeCloseTo(50 / 6);
  });

  it("período aún no iniciado", () => {
    const p = computeProjection({ total: 0, target: 70, start: "2026-12-01", end: "2026-12-07", today: "2026-11-02" });
    expect(p.notStarted).toBe(true);
    expect(p.daysElapsed).toBe(0);
    expect(p.requiredPace).toBe(10);
    expect(p.projectedTotal).toBe(0);
  });

  it("meta finalizada usa el valor real y no exige ritmo", () => {
    const p = computeProjection({ total: 80, target: 100, start: "2026-10-01", end: "2026-10-31", today: "2026-11-02" });
    expect(p.ended).toBe(true);
    expect(p.projectedTotal).toBe(80);
    expect(p.requiredPace).toBeNull();
    expect(p.daysRemaining).toBe(0);
    expect(p.isEstimate).toBe(false);
  });

  it("último día con pendiente: no hay días restantes", () => {
    const p = computeProjection({ total: 5, target: 10, start: "2026-11-02", end: "2026-11-02", today: "2026-11-02" });
    expect(p.daysRemaining).toBe(0);
    expect(p.requiredPace).toBeNull();
  });

  it("meta cumplida", () => {
    const p = computeProjection({ total: 120, target: 100, start: "2026-11-01", end: "2026-11-30", today: "2026-11-10" });
    expect(p.pending).toBe(0);
    expect(p.requiredPace).toBe(0);
    expect(p.percent).toBe(120);
    expect(p.onTrack).toBe(true);
  });

  it("valores no finitos se tratan como cero", () => {
    const p = computeProjection({ total: Number.NaN, target: 10, start: "2026-11-01", end: "2026-11-10", today: "2026-11-05" });
    expect(p.dailyAverage).toBe(0);
  });
});

describe("indicadores", () => {
  it("variación porcentual", () => {
    expect(percentChange(15, 10)).toBe(50);
    expect(percentChange(5, 0)).toBeNull();
  });
  it("tasa de interés positivo y sin datos suficientes", () => {
    expect(positiveInterestRate(3, 1)).toBe(75);
    expect(positiveInterestRate(0, 0)).toBeNull();
  });
});
