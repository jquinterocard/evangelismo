/**
 * Utilidades de fechas basadas en cadenas locales "YYYY-MM-DD".
 * Se trabaja con números de día (UTC) para evitar errores por horario de verano.
 */
import type { GoalPeriod } from "@/types";

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

export function isISODate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const m = ISO_RE.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

/** Fecha local del dispositivo en formato YYYY-MM-DD. */
export function toISODate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

function toDayNumber(iso: string): number {
  const m = ISO_RE.exec(iso);
  if (!m) throw new Error(`Fecha inválida: ${iso}`);
  return Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY_MS;
}

function fromDayNumber(n: number): string {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return fromDayNumber(toDayNumber(iso) + days);
}

/** b - a en días. */
export function diffDays(a: string, b: string): number {
  return toDayNumber(b) - toDayNumber(a);
}

/** Cantidad de días entre a y b, ambos incluidos (0 si b < a). */
export function daysInclusive(a: string, b: string): number {
  return Math.max(0, diffDays(a, b) + 1);
}

export function compareISO(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isWithin(iso: string, start: string, end: string): boolean {
  return iso >= start && iso <= end;
}

/** Lunes de la semana de la fecha dada. */
export function startOfWeek(iso: string): string {
  const n = toDayNumber(iso);
  const weekday = new Date(n * DAY_MS).getUTCDay(); // 0 domingo
  const offset = (weekday + 6) % 7;
  return fromDayNumber(n - offset);
}

export function endOfWeek(iso: string): string {
  return addDays(startOfWeek(iso), 6);
}

export function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function endOfMonth(iso: string): string {
  const y = +iso.slice(0, 4);
  const m = +iso.slice(5, 7);
  return fromDayNumber(Date.UTC(y, m, 0) / DAY_MS);
}

export function startOfQuarter(iso: string): string {
  const y = iso.slice(0, 4);
  const m = +iso.slice(5, 7);
  const qm = Math.floor((m - 1) / 3) * 3 + 1;
  return `${y}-${String(qm).padStart(2, "0")}-01`;
}

export function endOfQuarter(iso: string): string {
  const start = startOfQuarter(iso);
  const y = +start.slice(0, 4);
  const m = +start.slice(5, 7);
  return fromDayNumber(Date.UTC(y, m + 2, 0) / DAY_MS);
}

export interface DateRange {
  start: string;
  end: string;
}

/** Rango sugerido para un tipo de período, tomando como referencia la fecha dada. */
export function periodRange(period: GoalPeriod, ref: string = todayISO()): DateRange {
  switch (period) {
    case "daily":
      return { start: ref, end: ref };
    case "weekly":
      return { start: startOfWeek(ref), end: endOfWeek(ref) };
    case "monthly":
      return { start: startOfMonth(ref), end: endOfMonth(ref) };
    case "quarterly":
      return { start: startOfQuarter(ref), end: endOfQuarter(ref) };
    case "yearly":
      return { start: `${ref.slice(0, 4)}-01-01`, end: `${ref.slice(0, 4)}-12-31` };
    case "custom":
    default:
      return { start: ref, end: addDays(ref, 29) };
  }
}

/** Rango inmediatamente anterior de la misma duración. */
export function previousRange(range: DateRange): DateRange {
  const len = daysInclusive(range.start, range.end);
  return { start: addDays(range.start, -len), end: addDays(range.start, -1) };
}

/** Lista de fechas entre start y end (inclusive). Limitada para evitar bucles enormes. */
export function eachDay(start: string, end: string, max = 1000): string[] {
  const out: string[] = [];
  const total = Math.min(daysInclusive(start, end), max);
  for (let i = 0; i < total; i++) out.push(addDays(start, i));
  return out;
}

const longFmt = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const shortFmt = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", timeZone: "UTC" });

export function formatDate(iso: string): string {
  if (!isISODate(iso)) return iso;
  return longFmt.format(new Date(toDayNumber(iso) * DAY_MS));
}

export function formatShortDate(iso: string): string {
  if (!isISODate(iso)) return iso;
  return shortFmt.format(new Date(toDayNumber(iso) * DAY_MS));
}
