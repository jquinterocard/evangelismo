import { getSafeStorage } from "@/lib/storage";
import { pushRecent } from "./random";

const KEY = "uecj:recent-teachings";

export function readRecent(): string[] {
  try {
    const raw = getSafeStorage("session")?.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(-30) : [];
  } catch {
    return [];
  }
}

export function rememberTeaching(id: string): void {
  try {
    getSafeStorage("session")?.setItem(KEY, JSON.stringify(pushRecent(readRecent(), id)));
  } catch {
    /* sin storage: no se evita la repetición entre recargas */
  }
}
