/** Respaldos: exportación/importación JSON y exportación CSV. */
import { allStores } from "./stores";
import type { Store } from "./storage";

export const BACKUP_APP_ID = "un-encuentro-con-jesus";
export const BACKUP_FORMAT = 1;
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

type StoreKey = keyof typeof allStores;
const STORE_KEYS = Object.keys(allStores) as StoreKey[];

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  format: number;
  exportedAt: string;
  stores: Partial<Record<StoreKey, { v: number; data: unknown }>>;
}

export function createBackup(stores: Record<StoreKey, Store<unknown>> = allStores as never): BackupFile {
  const out: BackupFile = { app: BACKUP_APP_ID, format: BACKUP_FORMAT, exportedAt: new Date().toISOString(), stores: {} };
  for (const key of STORE_KEYS) out.stores[key] = { v: stores[key].version, data: stores[key].read() };
  return out;
}

export interface ImportSummary {
  counts: Partial<Record<StoreKey, number>>;
}

export type ImportMode = "replace" | "merge";

type Parsed = { [K in StoreKey]?: unknown };

/** Valida el contenido de un respaldo sin escribir nada. */
export function parseBackup(
  text: string,
  stores: Record<StoreKey, Store<unknown>> = allStores as never,
): { ok: true; data: Parsed; summary: ImportSummary } | { ok: false; message: string } {
  if (text.length > MAX_BACKUP_BYTES) return { ok: false, message: "El archivo es demasiado grande (máx. 5 MB)." };
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, message: "El archivo no es un JSON válido." };
  }
  const file = json as Partial<BackupFile>;
  if (!file || typeof file !== "object" || file.app !== BACKUP_APP_ID) {
    return { ok: false, message: "El archivo no es un respaldo de Un Encuentro con Jesús." };
  }
  if (typeof file.format !== "number" || file.format > BACKUP_FORMAT) {
    return { ok: false, message: "El respaldo proviene de una versión más reciente de la aplicación." };
  }
  if (!file.stores || typeof file.stores !== "object") return { ok: false, message: "El respaldo no contiene datos." };
  const data: Parsed = {};
  const counts: ImportSummary["counts"] = {};
  for (const key of STORE_KEYS) {
    const entry = (file.stores as Record<string, unknown>)[key] as { v?: unknown; data?: unknown } | undefined;
    if (!entry) continue;
    if (typeof entry.v !== "number") return { ok: false, message: `Versión ausente en «${key}».` };
    const parsed = stores[key].parseExternal(entry.data, entry.v);
    if (!parsed.ok) return { ok: false, message: `«${key}»: ${parsed.message}` };
    data[key] = parsed.value;
    counts[key] = Array.isArray(parsed.value) ? parsed.value.length : 1;
  }
  return { ok: true, data, summary: { counts } };
}

type WithId = { id: string; updatedAt?: string; createdAt?: string };

export function mergeById<T extends WithId>(current: T[], incoming: T[]): T[] {
  const map = new Map(current.map((x) => [x.id, x]));
  for (const item of incoming) {
    const existing = map.get(item.id);
    const a = existing?.updatedAt ?? existing?.createdAt ?? "";
    const b = item.updatedAt ?? item.createdAt ?? "";
    if (!existing || b >= a) map.set(item.id, item);
  }
  return [...map.values()];
}

/** Aplica un respaldo ya validado. Devuelve el primer error de escritura, si lo hay. */
export function applyBackup(
  data: Parsed,
  mode: ImportMode,
  stores: Record<StoreKey, Store<unknown>> = allStores as never,
): { ok: true } | { ok: false; message: string } {
  for (const key of STORE_KEYS) {
    if (!(key in data)) continue;
    const incoming = data[key];
    let next = incoming;
    if (mode === "merge") {
      const current = stores[key].read();
      if (Array.isArray(current) && Array.isArray(incoming)) next = mergeById(current as WithId[], incoming as WithId[]);
      else if (key === "learning") {
        const a = (current as { completed: string[] }).completed;
        const b = (incoming as { completed: string[] }).completed;
        next = { completed: [...new Set([...a, ...b])] };
      }
    }
    const res = stores[key].write(next);
    if (!res.ok) return { ok: false, message: res.message };
  }
  return { ok: true };
}

/** Escapa un valor para CSV y neutraliza la inyección de fórmulas en hojas de cálculo. */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r;]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvCell).join(","), ...rows.map((r) => r.map(csvCell).join(","))];
  // BOM para que Excel reconozca UTF-8 (tildes y ñ).
  return `﻿${lines.join("\r\n")}\r\n`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(text: string, filename: string, type: string): void {
  downloadBlob(new Blob([text], { type }), filename);
}
