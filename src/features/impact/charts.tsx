"use client";

import { useId, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Table2, BarChart3 } from "lucide-react";
import { formatShortDate } from "@/lib/dates";
import { fmt } from "./projections";

export interface Series {
  key: string;
  label: string;
  color: string;
  dashed?: boolean;
}

const AXIS = { stroke: "#8A96A3", fontSize: 12 };
const GRID = "#ECE9E1";

interface TooltipLike {
  active?: boolean;
  payload?: readonly { dataKey?: unknown; value?: unknown }[];
  label?: unknown;
}

function ChartTooltip({ active, payload, label, series, labelFormat }: TooltipLike & { series: Series[]; labelFormat?: (l: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-sm shadow-[var(--shadow-soft)]">
      <p className="mb-1 font-bold text-navy-ink">{labelFormat ? labelFormat(String(label)) : String(label)}</p>
      <ul className="flex flex-col gap-0.5">
        {payload
          .filter((p) => p.value !== null && p.value !== undefined)
          .map((p) => {
            const s = series.find((x) => x.key === p.dataKey);
            return (
              <li key={String(p.dataKey)} className="flex items-center gap-2 text-ink">
                <span className="size-2.5 rounded-full" style={{ background: s?.color }} aria-hidden />
                <span className="text-muted">{s?.label ?? String(p.dataKey)}:</span>
                <span className="font-bold tabular-nums">{fmt.dec(Number(p.value))}</span>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

export function Legend({ series }: { series: Series[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
      {series.map((s) => (
        <li key={s.key} className="inline-flex items-center gap-1.5">
          {s.dashed ? (
            <span className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: s.color }} aria-hidden />
          ) : (
            <span className="size-2.5 rounded-full" style={{ background: s.color }} aria-hidden />
          )}
          {s.label}
        </li>
      ))}
    </ul>
  );
}

/** Contenedor de gráfica con título, leyenda, nota y vista de tabla accesible. */
export function ChartCard({
  title,
  description,
  series,
  rows,
  labelKey,
  labelFormat,
  empty,
  children,
}: {
  title: string;
  description?: ReactNode;
  series: Series[];
  rows: Record<string, unknown>[];
  labelKey: string;
  labelFormat?: (l: string) => string;
  empty?: ReactNode;
  children: ReactNode;
}) {
  const [table, setTable] = useState(false);
  const id = useId();
  return (
    <section className="card flex min-w-0 flex-col gap-3 p-5" aria-labelledby={id}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 id={id} className="text-lg font-semibold">
            {title}
          </h3>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
        {!empty && (
          <button
            type="button"
            onClick={() => setTable((t) => !t)}
            className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-bold text-navy hover:bg-sky-soft"
            aria-pressed={table}
          >
            {table ? <BarChart3 className="size-4" aria-hidden /> : <Table2 className="size-4" aria-hidden />}
            {table ? "Gráfica" : "Tabla"}
          </button>
        )}
      </div>
      {empty ? (
        <div className="grid min-h-48 place-items-center rounded-xl bg-cream p-4 text-center text-sm text-muted">{empty}</div>
      ) : table ? (
        <div className="max-h-72 overflow-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-sky-soft text-left">
              <tr>
                <th scope="col" className="px-3 py-2">
                  Período
                </th>
                {series.map((s) => (
                  <th key={s.key} scope="col" className="px-3 py-2 text-right">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-line">
                  <th scope="row" className="px-3 py-1.5 text-left font-semibold">
                    {labelFormat ? labelFormat(String(r[labelKey])) : String(r[labelKey])}
                  </th>
                  {series.map((s) => (
                    <td key={s.key} className="px-3 py-1.5 text-right tabular-nums">
                      {r[s.key] === null || r[s.key] === undefined ? "—" : fmt.dec(Number(r[s.key]))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <Legend series={series} />
          <div className="h-64 w-full" role="img" aria-label={`${title}. Usa el botón Tabla para ver los valores.`}>
            {children}
          </div>
        </>
      )}
    </section>
  );
}

export function StackedBars({
  rows,
  series,
  xKey,
  xFormat = (v) => v,
  stacked = true,
  layout = "horizontal",
}: {
  rows: Record<string, unknown>[];
  series: Series[];
  xKey: string;
  xFormat?: (v: string) => string;
  stacked?: boolean;
  layout?: "horizontal" | "vertical";
}) {
  const vertical = layout === "vertical";
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} layout={layout} margin={{ top: 4, right: 8, bottom: 0, left: vertical ? 8 : 0 }} barCategoryGap="22%">
        <CartesianGrid stroke={GRID} vertical={vertical} horizontal={!vertical} />
        {vertical ? (
          <>
            <XAxis type="number" allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey={xKey} width={130} tick={AXIS} axisLine={false} tickLine={false} tickFormatter={xFormat} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={AXIS} axisLine={false} tickLine={false} tickFormatter={xFormat} minTickGap={12} />
            <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} width={44} />
          </>
        )}
        <Tooltip cursor={{ fill: "rgba(37,71,106,0.06)" }} content={(p) => <ChartTooltip active={p.active} payload={p.payload} label={p.label} series={series} labelFormat={xFormat} />} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            stackId={stacked ? "a" : undefined}
            fill={s.color}
            stroke="#fff"
            strokeWidth={stacked ? 1 : 0}
            radius={stacked ? (i === series.length - 1 ? (vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]) : 0) : vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            maxBarSize={36}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendLines({
  rows,
  series,
  xKey,
  target,
}: {
  rows: Record<string, unknown>[];
  series: Series[];
  xKey: string;
  target?: number;
}) {
  const withTarget = target ? rows.map((r) => ({ ...r, __target: target })) : rows;
  const all: Series[] = target ? [...series, { key: "__target", label: "Meta", color: "#8A96A3", dashed: true }] : series;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={withTarget} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS} axisLine={false} tickLine={false} tickFormatter={formatShortDate} minTickGap={16} />
        <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} width={44} />
        <Tooltip content={(p) => <ChartTooltip active={p.active} payload={p.payload} label={p.label} series={all} labelFormat={formatShortDate} />} />
        {all.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stroke={s.color}
            strokeWidth={2}
            strokeDasharray={s.dashed ? "6 5" : undefined}
            dot={false}
            activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
