import { describe, expect, it } from "vitest";
import { applyBackup, createBackup, csvCell, mergeById, parseBackup, toCsv } from "./backup";
import { activitiesStore, goalsStore, preferencesStore } from "./stores";

const now = "2026-11-02T10:00:00.000Z";
const act = (id: string, quantity = 1, updatedAt = now) => ({
  id,
  date: "2026-11-02",
  type: "qr_shared" as const,
  quantity,
  createdAt: now,
  updatedAt,
});
const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

describe("respaldo JSON", () => {
  it("exporta e importa (reemplazar) de forma idéntica", () => {
    activitiesStore.write([act(A, 5)]);
    goalsStore.write([
      { id: B, name: "Compartir 50 QR", metric: "qr_shared", target: 50, period: "weekly", startDate: "2026-11-02", endDate: "2026-11-08", createdAt: now, updatedAt: now },
    ]);
    const json = JSON.stringify(createBackup());
    activitiesStore.clear();
    goalsStore.clear();
    const parsed = parseBackup(json);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.summary.counts.activities).toBe(1);
    expect(applyBackup(parsed.data, "replace")).toEqual({ ok: true });
    expect(activitiesStore.read()[0].quantity).toBe(5);
    expect(goalsStore.read()[0].name).toBe("Compartir 50 QR");
    expect(preferencesStore.read().qrTemplate).toBe("cross");
  });

  it("fusiona por id conservando la versión más reciente", () => {
    activitiesStore.write([act(A, 1, "2026-11-01T00:00:00.000Z")]);
    const backup = { app: "un-encuentro-con-jesus", format: 1, exportedAt: now, stores: { activities: { v: 1, data: [act(A, 9), act(B, 2)] } } };
    const parsed = parseBackup(JSON.stringify(backup));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) applyBackup(parsed.data, "merge");
    const list = activitiesStore.read();
    expect(list).toHaveLength(2);
    expect(list.find((a) => a.id === A)?.quantity).toBe(9);
    expect(mergeById([act(A, 3, "2027-01-01T00:00:00.000Z")], [act(A, 1)])[0].quantity).toBe(3);
  });

  it("rechaza archivos inválidos sin escribir nada", () => {
    activitiesStore.write([act(A)]);
    expect(parseBackup("no es json").ok).toBe(false);
    expect(parseBackup(JSON.stringify({ app: "otra" })).ok).toBe(false);
    expect(parseBackup(JSON.stringify({ app: "un-encuentro-con-jesus", format: 99, stores: {} })).ok).toBe(false);
    const bad = { app: "un-encuentro-con-jesus", format: 1, stores: { activities: { v: 1, data: [{ ...act(B), quantity: -4 }] } } };
    const r = parseBackup(JSON.stringify(bad));
    expect(r.ok).toBe(false);
    expect(activitiesStore.read()).toHaveLength(1);
  });

  it("sanea el texto importado", () => {
    const backup = {
      app: "un-encuentro-con-jesus",
      format: 1,
      stores: { activities: { v: 1, data: [{ ...act(A), description: "  hola\u0000 <b>mundo</b>  " }] } },
    };
    const r = parseBackup(JSON.stringify(backup));
    expect(r.ok && (r.data.activities as { description: string }[])[0].description).toBe("hola <b>mundo</b>");
  });
});

describe("CSV", () => {
  it("escapa comas, comillas y saltos de línea", () => {
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(csvCell("línea\notra")).toBe('"línea\notra"');
    expect(csvCell(5)).toBe("5");
    expect(csvCell(undefined)).toBe("");
  });
  it("neutraliza inyección de fórmulas", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("@x")).toBe("'@x");
  });
  it("genera BOM y CRLF", () => {
    const csv = toCsv(["a", "b"], [[1, 2]]);
    expect(csv.startsWith("﻿a,b\r\n1,2")).toBe(true);
  });
});
