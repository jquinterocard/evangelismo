import { describe, expect, it } from "vitest";
import { bucketize, cumulativeWithProjection, monthRanges, weekRanges } from "./aggregate";

describe("agregaciones", () => {
  it("semanas lunes-domingo", () => {
    const w = weekRanges("2026-11-04", 2);
    expect(w).toEqual([
      expect.objectContaining({ start: "2026-10-26", end: "2026-11-01" }),
      expect.objectContaining({ start: "2026-11-02", end: "2026-11-08" }),
    ]);
  });
  it("meses", () => {
    const m = monthRanges("2026-03-15", 3);
    expect(m.map((x) => x.start)).toEqual(["2026-01-01", "2026-02-01", "2026-03-01"]);
    expect(m[1].end).toBe("2026-02-28");
  });
  it("bucketize suma por rango", () => {
    const b = bucketize(weekRanges("2026-11-04", 2), [
      { date: "2026-10-27", values: { a: 2 } },
      { date: "2026-11-03", values: { a: 5, b: 1 } },
      { date: "2026-12-01", values: { a: 100 } },
    ], ["a", "b"] as const);
    expect(b.map((x) => x.values)).toEqual([{ a: 2, b: 0 }, { a: 5, b: 1 }]);
  });
  it("acumulado con proyección", () => {
    const r = cumulativeWithProjection(
      [
        { date: "2026-11-01", value: 2 },
        { date: "2026-11-02", value: 4 },
        { date: "2026-11-03", value: 0 },
        { date: "2026-11-04", value: 0 },
      ],
      "2026-11-02",
    );
    expect(r[1]).toEqual({ date: "2026-11-02", real: 6, projected: 6 });
    expect(r[3]).toEqual({ date: "2026-11-04", real: null, projected: 12 });
  });
});
