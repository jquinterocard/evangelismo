/**
 * Capa de abstracción sobre LocalStorage.
 * - Sobre versionado: { v, data, savedAt }.
 * - Validación con zod al leer (los datos del navegador no son confiables).
 * - Migraciones entre versiones.
 * - Manejo de almacenamiento lleno y de navegadores sin acceso a storage.
 */
import type { ZodType } from "zod";

export const STORAGE_PREFIX = "uecj:";

export type StorageError = "quota" | "unavailable" | "invalid";
export type WriteResult = { ok: true } | { ok: false; error: StorageError; message: string };

export interface StoreDefinition<T> {
  key: string;
  version: number;
  schema: ZodType<T, unknown>;
  defaultValue: () => T;
  /** Convierte datos de una versión anterior al formato actual. */
  migrate?: (data: unknown, fromVersion: number) => unknown;
}

export interface Store<T> {
  readonly key: string;
  readonly version: number;
  read(): T;
  write(value: T): WriteResult;
  update(fn: (current: T) => T): WriteResult;
  clear(): void;
  /** Valor por defecto estable (misma referencia), útil para el prerender. */
  defaultSnapshot(): T;
  subscribe(listener: () => void): () => void;
  /** Valida datos externos (p. ej. un respaldo) con el mismo esquema y migraciones. */
  parseExternal(data: unknown, version?: number): { ok: true; value: T } | { ok: false; message: string };
}

interface Envelope {
  v: number;
  data: unknown;
  savedAt?: string;
}

export function getSafeStorage(kind: "local" | "session" = "local"): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const s = kind === "local" ? window.localStorage : window.sessionStorage;
    const probe = `${STORAGE_PREFIX}__probe`;
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export function isQuotaError(err: unknown): boolean {
  if (!(err instanceof DOMException) && !(err instanceof Error)) return false;
  const e = err as DOMException;
  return (
    e.name === "QuotaExceededError" ||
    e.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    e.code === 22 ||
    e.code === 1014
  );
}

export function createStore<T>(
  def: StoreDefinition<T>,
  getStorage: () => Storage | null = () => getSafeStorage("local"),
): Store<T> {
  const fullKey = `${STORAGE_PREFIX}${def.key}`;
  const listeners = new Set<() => void>();
  let cache: { raw: string | null; value: T } | null = null;
  let defaultSnap: { value: T } | null = null;

  const notify = () => listeners.forEach((l) => l());

  function parseExternal(data: unknown, version = def.version) {
    let payload = data;
    if (version > def.version) {
      return { ok: false as const, message: "Los datos provienen de una versión más reciente de la aplicación." };
    }
    if (version < def.version) {
      if (!def.migrate) return { ok: false as const, message: "Formato de datos antiguo sin migración disponible." };
      try {
        payload = def.migrate(payload, version);
      } catch {
        return { ok: false as const, message: "No se pudieron migrar los datos." };
      }
    }
    const result = def.schema.safeParse(payload);
    if (!result.success) {
      const issue = result.error.issues[0];
      return {
        ok: false as const,
        message: `Datos inválidos${issue ? ` en «${issue.path.join(".") || "raíz"}»: ${issue.message}` : ""}.`,
      };
    }
    return { ok: true as const, value: result.data };
  }

  function read(): T {
    const storage = getStorage();
    if (!storage) return cache?.value ?? def.defaultValue();
    let raw: string | null = null;
    try {
      raw = storage.getItem(fullKey);
    } catch {
      return def.defaultValue();
    }
    if (cache && cache.raw === raw) return cache.value;
    let value: T = def.defaultValue();
    if (raw) {
      try {
        const env = JSON.parse(raw) as Envelope;
        if (env && typeof env === "object" && typeof env.v === "number") {
          const parsed = parseExternal(env.data, env.v);
          if (parsed.ok) value = parsed.value;
          else console.warn(`[storage] ${fullKey}: ${parsed.message} Se usan valores por defecto.`);
        }
      } catch {
        console.warn(`[storage] ${fullKey}: JSON corrupto. Se usan valores por defecto.`);
      }
    }
    cache = { raw, value };
    return value;
  }

  function write(value: T): WriteResult {
    const parsed = def.schema.safeParse(value);
    if (!parsed.success) {
      return { ok: false, error: "invalid", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }
    const storage = getStorage();
    if (!storage) {
      return {
        ok: false,
        error: "unavailable",
        message: "Este navegador no permite guardar datos (modo privado o almacenamiento bloqueado).",
      };
    }
    const raw = JSON.stringify({ v: def.version, data: parsed.data, savedAt: new Date().toISOString() } satisfies Envelope);
    try {
      storage.setItem(fullKey, raw);
    } catch (err) {
      if (isQuotaError(err)) {
        return {
          ok: false,
          error: "quota",
          message: "El almacenamiento del navegador está lleno. Elimina registros antiguos para liberar espacio.",
        };
      }
      return { ok: false, error: "unavailable", message: "No se pudo guardar en este navegador." };
    }
    cache = { raw, value: parsed.data };
    notify();
    return { ok: true };
  }

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === fullKey || e.key === null) {
        cache = null;
        notify();
      }
    });
  }

  return {
    key: fullKey,
    version: def.version,
    read,
    write,
    update: (fn) => write(fn(read())),
    clear() {
      try {
        getStorage()?.removeItem(fullKey);
      } catch {
        /* ignorar */
      }
      cache = null;
      notify();
    },
    defaultSnapshot() {
      if (!defaultSnap) defaultSnap = { value: def.defaultValue() };
      return defaultSnap.value;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    parseExternal,
  };
}
