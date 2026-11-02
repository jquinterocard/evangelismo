import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createStore, STORAGE_PREFIX } from "./storage";
import { activitiesStore } from "./stores";

const schema = z.array(z.object({ id: z.string(), n: z.number() }));

function memoryStorage(opts: { quotaAfter?: number } = {}): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => {
      if (opts.quotaAfter !== undefined && v.length > opts.quotaAfter) throw new DOMException("full", "QuotaExceededError");
      m.set(k, v);
    },
  };
}

describe("almacenamiento local", () => {
  it("guarda con sobre versionado y lee validando", () => {
    const s = memoryStorage();
    const store = createStore({ key: "t", version: 2, schema, defaultValue: () => [] }, () => s);
    expect(store.write([{ id: "a", n: 1 }])).toEqual({ ok: true });
    const env = JSON.parse(s.getItem(`${STORAGE_PREFIX}t`)!);
    expect(env.v).toBe(2);
    expect(store.read()).toEqual([{ id: "a", n: 1 }]);
  });

  it("migra datos de versiones anteriores", () => {
    const s = memoryStorage();
    s.setItem(`${STORAGE_PREFIX}t`, JSON.stringify({ v: 1, data: [{ id: "a", count: 3 }] }));
    const store = createStore(
      {
        key: "t",
        version: 2,
        schema,
        defaultValue: () => [],
        migrate: (d) => (d as { id: string; count: number }[]).map((x) => ({ id: x.id, n: x.count })),
      },
      () => s,
    );
    expect(store.read()).toEqual([{ id: "a", n: 3 }]);
  });

  it("ignora datos corruptos o inválidos", () => {
    const s = memoryStorage();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const store = createStore({ key: "t", version: 1, schema, defaultValue: () => [] }, () => s);
    s.setItem(`${STORAGE_PREFIX}t`, "{no json");
    expect(store.read()).toEqual([]);
    s.setItem(`${STORAGE_PREFIX}t`, JSON.stringify({ v: 1, data: [{ id: 1 }] }));
    expect(store.read()).toEqual([]);
    s.setItem(`${STORAGE_PREFIX}t`, JSON.stringify({ v: 9, data: [] }));
    expect(store.read()).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it("informa cuando el almacenamiento está lleno", () => {
    const store = createStore({ key: "t", version: 1, schema, defaultValue: () => [] }, () => memoryStorage({ quotaAfter: 50 }));
    const big = Array.from({ length: 20 }, (_, i) => ({ id: `id-${i}`, n: i }));
    const r = store.write(big);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toBe("quota");
  });

  it("informa cuando el almacenamiento no está disponible", () => {
    const store = createStore({ key: "t", version: 1, schema, defaultValue: () => [] }, () => null);
    expect(store.read()).toEqual([]);
    const r = store.write([]);
    expect(!r.ok && r.error).toBe("unavailable");
  });

  it("rechaza escrituras inválidas y notifica a suscriptores", () => {
    const store = createStore({ key: "t", version: 1, schema, defaultValue: () => [] }, () => memoryStorage());
    const fn = vi.fn();
    store.subscribe(fn);
    expect(store.write([{ id: 1 } as never]).ok).toBe(false);
    store.write([{ id: "x", n: 1 }]);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(store.defaultSnapshot()).toBe(store.defaultSnapshot());
  });

  it("el almacén de actividades usa localStorage real (jsdom)", () => {
    const now = new Date().toISOString();
    const a = { id: crypto.randomUUID(), date: "2026-11-02", type: "qr_shared" as const, quantity: 3, createdAt: now, updatedAt: now };
    expect(activitiesStore.write([a]).ok).toBe(true);
    expect(activitiesStore.read()).toHaveLength(1);
    expect(window.localStorage.getItem("uecj:activities")).toContain("qr_shared");
  });
});
