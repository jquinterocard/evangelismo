import { describe, expect, it } from "vitest";
import type { Teaching } from "@/types";
import { cryptoRng, pickRandomTeaching, pushRecent, recentWindow } from "./random";

const t = (id: string, active = true) => ({ id, active }) as Teaching;
const pool = ["a", "b", "c", "d", "e"].map((x) => t(x));

describe("selección aleatoria", () => {
  it("solo elige enseñanzas activas", () => {
    for (let i = 0; i < 50; i++) expect(pickRandomTeaching([t("x", false), t("y")], [], Math.random)?.id).toBe("y");
    expect(pickRandomTeaching([t("x", false)], [])).toBeNull();
  });

  it("no repite inmediatamente y evita las recientes", () => {
    let recent: string[] = [];
    let last = "";
    for (let i = 0; i < 200; i++) {
      const pick = pickRandomTeaching(pool, recent, cryptoRng)!;
      expect(pick.id).not.toBe(last);
      expect(recent.slice(-recentWindow(pool.length))).not.toContain(pick.id);
      recent = pushRecent(recent, pick.id);
      last = pick.id;
    }
  });

  it("recorre todo el catálogo antes de repetir (ventana = n-1)", () => {
    let recent: string[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < pool.length; i++) {
      const p = pickRandomTeaching(pool, recent, Math.random)!;
      seen.add(p.id);
      recent = pushRecent(recent, p.id);
    }
    expect(seen.size).toBe(pool.length);
  });

  it("con una sola enseñanza la devuelve aunque sea repetida", () => {
    expect(pickRandomTeaching([t("solo")], ["solo"])?.id).toBe("solo");
  });

  it("es determinista con un rng dado", () => {
    expect(pickRandomTeaching(pool, [], () => 0)?.id).toBe("a");
    expect(pickRandomTeaching(pool, [], () => 0.9999)?.id).toBe("e");
  });

  it("acota el historial", () => {
    let r: string[] = [];
    for (let i = 0; i < 100; i++) r = pushRecent(r, String(i));
    expect(r).toHaveLength(30);
  });
});
