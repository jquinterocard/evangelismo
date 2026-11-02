"use client";

import Link from "next/link";
import { useState } from "react";
import { BookCheck, CloudOff, Heart, Percent, RefreshCw, SkipForward, ThumbsDown, HelpCircle } from "lucide-react";
import type { Goal } from "@/types";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/hooks/useStore";
import { activitiesStore, qrHistoryStore } from "@/lib/stores";
import { addDays, endOfMonth, formatShortDate, startOfMonth, todayISO } from "@/lib/dates";
import { teachingRepository } from "@/features/teachings/repository";
import { useGlobalDaily, useTopTeachings } from "@/features/completions/useGlobalStats";
import { GoalCard } from "@/features/goals/GoalCard";
import { isGlobalMetric } from "@/features/goals/model";
import { ChartCard, StackedBars, type Series } from "./charts";
import { bucketize, monthRanges, weekRanges } from "./aggregate";
import { computeProjection, fmt, positiveInterestRate } from "./projections";

const RESP_KEYS = ["completions", "positive", "negative", "skipped"] as const;
const completionSeries: Series[] = [{ key: "completions", label: "Enseñanzas completadas", color: "#2F6DB0" }];
const responseSeries: Series[] = [
  { key: "positive", label: "Respuestas positivas", color: "#2E8A63" },
  { key: "negative", label: "Respuestas negativas", color: "#7E62B3" },
  { key: "skipped", label: "Preguntas omitidas", color: "#8A96A3" },
];

export function GlobalImpact({ goals }: { goals: Goal[] }) {
  const today = todayISO();
  const [refresh, setRefresh] = useState(0);
  const months = monthRanges(today, 6);
  const weeks = weekRanges(today, 12);
  const from = months[0].start < weeks[0].start ? months[0].start : weeks[0].start;
  const daily = useGlobalDaily(from, today, refresh);
  const last30From = addDays(today, -29);
  const top = useTopTeachings(last30From, today, refresh);
  const activities = useStore(activitiesStore);
  const qrHistory = useStore(qrHistoryStore);
  const globalGoals = goals.filter((g) => isGlobalMetric(g.metric) && g.endDate >= today);

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id="global" className="text-2xl font-semibold">
          Lo que hacen los visitantes
        </h2>
        <p className="max-w-2xl text-sm text-muted">
          Se actualiza solo: enseñanzas que los visitantes marcaron voluntaria y anónimamente como completadas al escanear un QR, y sus
          respuestas opcionales. No son personas únicas ni conversiones.
        </p>
      </div>
      {daily.status !== "not_configured" && (
        <Button variant="ghost" size="sm" onClick={() => setRefresh((r) => r + 1)} icon={<RefreshCw className="size-4" aria-hidden />}>
          Actualizar
        </Button>
      )}
    </div>
  );

  if (daily.status === "not_configured") {
    return (
      <section aria-labelledby="global" className="flex flex-col gap-4">
        {header}
        <div className="card flex items-start gap-4 p-6">
          <CloudOff className="size-8 shrink-0 text-muted" aria-hidden />
          <div>
            <p className="font-bold text-navy-ink">Las estadísticas globales no están disponibles.</p>
            <p className="mt-1 text-sm text-muted">
              Este sitio no tiene configurado el registro global (Supabase). Las enseñanzas, los códigos QR y tus registros locales funcionan
              con normalidad. Consulta <code>docs/SUPABASE.md</code> para activarlo.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (daily.status === "loading") {
    return (
      <section aria-labelledby="global" className="flex flex-col gap-4" aria-busy="true">
        {header}
        <div className="card h-48 animate-pulse" />
      </section>
    );
  }

  if (daily.status === "error") {
    return (
      <section aria-labelledby="global" className="flex flex-col gap-4">
        {header}
        <p role="alert" className="card p-5 text-rose-ink">
          No se pudieron cargar las estadísticas globales. Revisa tu conexión e inténtalo de nuevo.
        </p>
      </section>
    );
  }

  const data = daily.data;
  const rows = data.map((d) => ({ date: d.day, values: { completions: d.completions, positive: d.positive, negative: d.negative, skipped: d.skipped } }));
  const sum = (key: (typeof RESP_KEYS)[number], start: string, end: string) =>
    data.filter((d) => d.day >= start && d.day <= end).reduce((s, d) => s + d[key], 0);

  const totals = Object.fromEntries(RESP_KEYS.map((k) => [k, sum(k, from, today)])) as Record<(typeof RESP_KEYS)[number], number>;
  const unanswered = Math.max(0, totals.completions - totals.positive - totals.negative - totals.skipped);
  const rate = positiveInterestRate(totals.positive, totals.negative);

  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthCompletions = sum("completions", monthStart, today);
  const proj = computeProjection({ total: monthCompletions, target: 0, start: monthStart, end: monthEnd, today });

  const last30 = data.filter((d) => d.day >= last30From).map((d) => ({ date: d.day, completions: d.completions }));
  const weekly = bucketize(weeks, rows, RESP_KEYS).map((b) => ({ label: b.label, ...b.values }));
  const monthly = bucketize(months, rows, RESP_KEYS).map((b) => ({ label: b.label, ...b.values }));
  const hasData = totals.completions > 0;

  return (
    <section aria-labelledby="global" className="flex flex-col gap-4">
      {header}
      <p className="text-sm text-muted">
        Período: {formatShortDate(from)} – {formatShortDate(today)} (últimos 6 meses).
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Enseñanzas completadas" icon={<BookCheck className="size-5" aria-hidden />} value={fmt.int(totals.completions)} hint={`Este mes: ${fmt.int(monthCompletions)} · proyección ≈ ${fmt.int(proj.projectedTotal)} (estimación)`} />
        <StatCard label="Respuestas positivas" tone="hope" icon={<Heart className="size-5" aria-hidden />} value={fmt.int(totals.positive)} hint="«Sí, quiero aprender más»" />
        <StatCard
          label="Tasa de interés positivo"
          tone="gold"
          icon={<Percent className="size-5" aria-hidden />}
          value={rate === null ? "Sin datos suficientes" : fmt.pct(rate)}
          hint="Positivas ÷ (positivas + negativas). No es una tasa de conversión."
        />
        <StatCard label="Respuestas negativas" tone="sky" icon={<ThumbsDown className="size-5" aria-hidden />} value={fmt.int(totals.negative)} hint="«Por ahora no, gracias»" />
        <StatCard label="Preguntas omitidas" tone="sky" icon={<SkipForward className="size-5" aria-hidden />} value={fmt.int(totals.skipped)} hint="Cuando se eligió «Omitir»" />
        <StatCard label="Finalizaciones sin respuesta" tone="rose" icon={<HelpCircle className="size-5" aria-hidden />} value={fmt.int(unanswered)} hint="Cerraron sin responder (calculado)" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Finalizaciones por día"
          description="Últimos 30 días."
          series={completionSeries}
          rows={last30}
          labelKey="date"
          labelFormat={formatShortDate}
          empty={!hasData ? "Todavía no hay finalizaciones registradas." : undefined}
        >
          <StackedBars rows={last30} series={completionSeries} xKey="date" xFormat={formatShortDate} />
        </ChartCard>
        <ChartCard
          title="Finalizaciones por semana"
          description="Últimas 12 semanas."
          series={completionSeries}
          rows={weekly}
          labelKey="label"
          empty={!hasData ? "Todavía no hay finalizaciones registradas." : undefined}
        >
          <StackedBars rows={weekly} series={completionSeries} xKey="label" />
        </ChartCard>
        <ChartCard
          title="Evolución semanal de respuestas"
          description="Respuestas voluntarias por semana."
          series={responseSeries}
          rows={weekly}
          labelKey="label"
          empty={totals.positive + totals.negative + totals.skipped === 0 ? "Todavía no hay respuestas registradas." : undefined}
        >
          <StackedBars rows={weekly} series={responseSeries} xKey="label" />
        </ChartCard>
        <ChartCard
          title="Evolución mensual"
          description="Finalizaciones y respuestas por mes (6 meses)."
          series={[...completionSeries, ...responseSeries]}
          rows={monthly}
          labelKey="label"
          empty={!hasData ? "Todavía no hay finalizaciones registradas." : undefined}
        >
          <StackedBars rows={monthly} series={[...completionSeries, ...responseSeries]} xKey="label" stacked={false} />
        </ChartCard>
      </div>

      <div className="card p-5">
        <h3 className="text-lg font-semibold">Enseñanzas más completadas (30 días)</h3>
        {top.status === "ready" && top.data.length > 0 ? (
          <ol className="mt-3 flex flex-col gap-2">
            {top.data.map((t, i) => {
              const teaching = teachingRepository.byId(t.teachingId);
              const max = top.data[0].completions || 1;
              return (
                <li key={t.teachingId} className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-3">
                  <span className="font-serif text-lg text-gold-ink">{i + 1}</span>
                  <span className="min-w-0">
                    {teaching ? (
                      <Link href={`/ensenanzas/${teaching.id}/`} className="block truncate font-semibold text-navy-ink hover:underline">
                        {teaching.title}
                      </Link>
                    ) : (
                      <span className="block truncate text-muted">{t.teachingId}</span>
                    )}
                    <span className="mt-1 block h-1.5 rounded-full bg-sky">
                      <span className="block h-full rounded-full bg-[#2F6DB0]" style={{ width: `${(t.completions / max) * 100}%` }} />
                    </span>
                  </span>
                  <span className="font-bold tabular-nums">{fmt.int(t.completions)}</span>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-muted">{top.status === "loading" ? "Cargando…" : "Todavía no hay datos suficientes."}</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold">Metas de alcance (indicadores globales)</h3>
        {globalGoals.length === 0 ? (
          <p className="text-sm text-muted">
            Puedes crear metas semanales o mensuales de enseñanzas completadas, respuestas positivas o participación voluntaria en{" "}
            <Link href="/metas/" className="font-bold text-navy underline">
              Metas
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {globalGoals.map((g) => (
              <GoalCard key={g.id} goal={g} activities={activities} qrHistory={qrHistory} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
