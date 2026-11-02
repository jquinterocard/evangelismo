/** Agregaciones por semana y mes para gráficas. */
import { addDays, startOfMonth, startOfWeek, endOfMonth, endOfWeek, formatShortDate } from "@/lib/dates";

export interface Bucket<T extends string> {
  key: string;
  label: string;
  start: string;
  end: string;
  values: Record<T, number>;
}

const monthFmt = new Intl.DateTimeFormat("es", { month: "short", year: "2-digit", timeZone: "UTC" });

export function monthLabel(iso: string): string {
  return monthFmt.format(new Date(`${iso.slice(0, 7)}-01T00:00:00Z`));
}

/** Últimas `count` semanas (lunes a domingo) que terminan en la semana de `today`. */
export function weekRanges(today: string, count: number) {
  const out: { start: string; end: string; label: string }[] = [];
  let start = startOfWeek(today);
  for (let i = 0; i < count; i++) {
    out.unshift({ start, end: endOfWeek(start), label: formatShortDate(start) });
    start = addDays(start, -7);
  }
  return out;
}

/** Últimos `count` meses que terminan en el mes de `today`. */
export function monthRanges(today: string, count: number) {
  const out: { start: string; end: string; label: string }[] = [];
  let start = startOfMonth(today);
  for (let i = 0; i < count; i++) {
    out.unshift({ start, end: endOfMonth(start), label: monthLabel(start) });
    start = startOfMonth(addDays(start, -1));
  }
  return out;
}

/** Suma registros diarios en rangos. */
export function bucketize<T extends string>(
  ranges: { start: string; end: string; label: string }[],
  rows: { date: string; values: Partial<Record<T, number>> }[],
  keys: readonly T[],
): Bucket<T>[] {
  return ranges.map((r) => {
    const values = Object.fromEntries(keys.map((k) => [k, 0])) as Record<T, number>;
    for (const row of rows) {
      if (row.date < r.start || row.date > r.end) continue;
      for (const k of keys) values[k] += row.values[k] ?? 0;
    }
    return { key: r.start, label: r.label, start: r.start, end: r.end, values };
  });
}

/** Serie acumulada con proyección lineal hasta el final del período (solo días futuros). */
export function cumulativeWithProjection(
  daily: { date: string; value: number }[],
  today: string,
): { date: string; real: number | null; projected: number | null }[] {
  let acc = 0;
  let elapsed = 0;
  const past = daily.filter((d) => d.date <= today);
  for (const d of past) {
    acc += d.value;
    elapsed++;
  }
  const avg = elapsed > 0 ? acc / elapsed : 0;
  let running = 0;
  let projected = acc;
  return daily.map((d) => {
    if (d.date <= today) {
      running += d.value;
      return { date: d.date, real: running, projected: d.date === today ? running : null };
    }
    projected += avg;
    return { date: d.date, real: null, projected: Math.round(projected * 100) / 100 };
  });
}
