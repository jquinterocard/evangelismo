/** Selección aleatoria de enseñanzas evitando repeticiones inmediatas dentro de la sesión. */
import type { Teaching } from "@/types";

export type Rng = () => number;

/** Cuántas enseñanzas recientes se evitan, según el tamaño del catálogo. */
export function recentWindow(poolSize: number, max = 10): number {
  return Math.max(0, Math.min(max, poolSize - 1));
}

/**
 * Elige una enseñanza activa al azar excluyendo las vistas recientemente.
 * Si todas fueron vistas, solo excluye la última para no repetir inmediatamente.
 */
export function pickRandomTeaching(
  pool: readonly Teaching[],
  recentIds: readonly string[],
  rng: Rng = Math.random,
): Teaching | null {
  const active = pool.filter((t) => t.active);
  if (active.length === 0) return null;
  if (active.length === 1) return active[0];
  const window = recentWindow(active.length);
  const avoid = new Set(recentIds.slice(-window));
  let candidates = active.filter((t) => !avoid.has(t.id));
  if (candidates.length === 0) {
    const last = recentIds[recentIds.length - 1];
    candidates = active.filter((t) => t.id !== last);
  }
  const index = Math.min(candidates.length - 1, Math.floor(rng() * candidates.length));
  return candidates[index];
}

/** Añade un id al historial, manteniendo un tamaño acotado. */
export function pushRecent(recent: readonly string[], id: string, max = 30): string[] {
  return [...recent.filter((x) => x !== id), id].slice(-max);
}

/** RNG criptográfico en [0,1). */
export function cryptoRng(): number {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return buf[0] / 2 ** 32;
}
