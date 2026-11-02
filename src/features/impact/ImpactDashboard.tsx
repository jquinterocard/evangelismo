"use client";

import Link from "next/link";
import { useState } from "react";
import { BookCheck, Eye, HeartHandshake, MessageCircleHeart, QrCode, Share2, Sparkles, Target, TrendingUp } from "lucide-react";
import type { Goal } from "@/types";
import { ACTIVITY_TYPES } from "@/types";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { buttonClass } from "@/components/ui/Button";
import { useHydrated, useStore } from "@/hooks/useStore";
import { activitiesStore, goalsStore, qrHistoryStore } from "@/lib/stores";
import { addDays, eachDay, endOfMonth, formatShortDate, startOfMonth, todayISO } from "@/lib/dates";
import { ACTIVITY_COLORS, ACTIVITY_LABELS, dailySeries, totalsInRange } from "@/features/activities/model";
import { goalProgress, METRIC_LABELS } from "@/features/goals/model";
import { GoalCard } from "@/features/goals/GoalCard";
import { ChartCard, StackedBars, TrendLines, type Series } from "./charts";
import { bucketize, cumulativeWithProjection, monthRanges, weekRanges } from "./aggregate";
import { computeProjection, fmt } from "./projections";
import { GlobalImpact } from "./GlobalImpact";

const MESSAGES = [
  "«Vayan y hagan discípulos de todas las naciones» (Mateo 28:19). Cada semilla sembrada con amor cuenta.",
  "No se trata de números, sino de personas amadas por Dios. Gracias por compartir esperanza.",
  "La fidelidad en lo pequeño también es servicio. Sigue sembrando; Dios da el crecimiento (1 Corintios 3:6).",
];

const activitySeries: Series[] = ACTIVITY_TYPES.map((t) => ({ key: t, label: ACTIVITY_LABELS[t], color: ACTIVITY_COLORS[t] }));

function pickGoal(goals: Goal[], period: "weekly" | "monthly", today: string): Goal | undefined {
  return goals
    .filter((g) => g.period === period && g.startDate <= today && g.endDate >= today)
    .sort((a, b) => a.endDate.localeCompare(b.endDate))[0];
}

export function ImpactDashboard() {
  const hydrated = useHydrated();
  const activities = useStore(activitiesStore);
  const goals = useStore(goalsStore);
  const qrHistory = useStore(qrHistoryStore);
  const [compare, setCompare] = useState<"week" | "month">("week");
  const today = todayISO();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const src = { activities, qrHistory, global: null };

  const monthTotals = totalsInRange(activities, { start: monthStart, end: monthEnd });
  const allTotals = totalsInRange(activities);
  const weeklyGoal = pickGoal(goals, "weekly", today);
  const monthlyGoal = pickGoal(goals, "monthly", today);
  const wp = weeklyGoal ? goalProgress(weeklyGoal, src, today) : null;
  const mp = monthlyGoal ? goalProgress(monthlyGoal, src, today) : null;

  // Proyección mensual de todas las actividades registradas este mes.
  const monthSum = ACTIVITY_TYPES.reduce((s, t) => s + monthTotals[t], 0);
  const monthProjection = computeProjection({ total: monthSum, target: 0, start: monthStart, end: monthEnd, today });

  const last30 = dailySeries(activities, { start: addDays(today, -29), end: today });
  const hasActivity = activities.length > 0;

  const ranges = compare === "week" ? weekRanges(today, 8) : monthRanges(today, 6);
  const compareRows = bucketize(
    ranges,
    activities.map((a) => ({ date: a.date, values: { [a.type]: a.quantity } })),
    ACTIVITY_TYPES,
  ).map((b) => ({ label: b.label, ...b.values }));

  const distribution = ACTIVITY_TYPES.map((t) => ({ label: ACTIVITY_LABELS[t], [t]: allTotals[t] }));

  const activeGoals = goals.filter((g) => g.startDate <= today && g.endDate >= today);
  const goalRows = activeGoals
    .map((g) => {
      const p = goalProgress(g, src, today);
      return { label: g.name.length > 22 ? `${g.name.slice(0, 21)}…` : g.name, progreso: p.projection ? Math.round(Math.min(100, p.projection.percent)) : null };
    })
    .filter((r) => r.progreso !== null);

  // Actividades acumuladas del mes en curso.
  const monthDaily = eachDay(monthStart, monthEnd).map((d) => ({
    date: d,
    value: activities.filter((a) => a.date === d).reduce((s, a) => s + a.quantity, 0),
  }));
  const trendRows = cumulativeWithProjection(monthDaily, today).map((r) => ({ date: r.date, real: r.real, proyeccion: r.projected }));

  const message = MESSAGES[new Date().getDate() % MESSAGES.length];

  if (!hydrated) return <div className="card h-96 animate-pulse" aria-hidden />;

  return (
    <div className="flex flex-col gap-10">
      <p className="flex items-start gap-3 rounded-2xl bg-gold-soft/70 p-4 font-serif text-lg text-navy-ink">
        <Sparkles className="mt-1 size-5 shrink-0 text-gold-ink" aria-hidden /> {message}
      </p>

      {/* Primero lo que se actualiza solo: finalizaciones de los visitantes (Supabase). */}
      <GlobalImpact goals={goals} />

      {/* Tarjetas principales (locales) */}
      <section aria-labelledby="locales" className="flex flex-col gap-4">
        <div>
          <h2 id="locales" className="text-2xl font-semibold">
            Tus registros manuales
          </h2>
          <p className="text-sm text-muted">
            Lo que anotas tú en{" "}
            <Link href="/actividades/" className="font-bold text-navy underline">
              Actividades
            </Link>{" "}
            (QR entregados, visitas, personas interesadas…). No se llena solo · datos de este navegador · mes en curso (
            {formatShortDate(monthStart)} – {formatShortDate(monthEnd)}).
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Meta semanal"
            icon={<Target className="size-5" aria-hidden />}
            value={wp?.current != null ? `${fmt.int(wp.current)} / ${fmt.int(wp.goal.target)}` : "—"}
            hint={weeklyGoal ? `${weeklyGoal.name} · ${METRIC_LABELS[weeklyGoal.metric]}` : <Link href="/metas/" className="font-bold text-navy underline">Crear una meta semanal</Link>}
          >
            {wp?.current != null && <ProgressBar value={wp.current} max={wp.goal.target} label="Progreso semanal" />}
          </StatCard>
          <StatCard
            label="Progreso semanal"
            tone="hope"
            icon={<TrendingUp className="size-5" aria-hidden />}
            value={wp?.projection ? fmt.pct(Math.min(999, wp.projection.percent)) : "—"}
            hint={wp?.projection ? `Faltan ${fmt.int(wp.projection.pending)} · ${wp.projection.daysRemaining} días restantes` : "Sin meta semanal vigente"}
          />
          <StatCard
            label="Meta mensual"
            icon={<Target className="size-5" aria-hidden />}
            tone="gold"
            value={mp?.current != null ? `${fmt.int(mp.current)} / ${fmt.int(mp.goal.target)}` : "—"}
            hint={monthlyGoal ? monthlyGoal.name : <Link href="/metas/" className="font-bold text-navy underline">Crear una meta mensual</Link>}
          >
            {mp?.current != null && <ProgressBar value={mp.current} max={mp.goal.target} label="Progreso mensual" tone="gold" />}
          </StatCard>
          <StatCard
            label="Proyección mensual (estimación)"
            icon={<TrendingUp className="size-5" aria-hidden />}
            value={mp?.projection ? `≈ ${fmt.int(mp.projection.projectedTotal)}` : `≈ ${fmt.int(monthProjection.projectedTotal)}`}
            hint={
              mp?.projection
                ? `Para «${mp.goal.name}». Promedio ${fmt.dec(mp.projection.dailyAverage)}/día.`
                : `Todas las actividades del mes. Promedio ${fmt.dec(monthProjection.dailyAverage)}/día.`
            }
          />
          <StatCard
            label="QR compartidos (mes)"
            icon={<QrCode className="size-5" aria-hidden />}
            value={fmt.int(monthTotals.qr_shared)}
            hint={`${fmt.int(qrHistory.length)} QR generados localmente en total`}
          />
          <StatCard
            label="Personas interesadas reportadas (mes)"
            tone="rose"
            icon={<HeartHandshake className="size-5" aria-hidden />}
            value={fmt.int(monthTotals.interested_reported)}
            hint="Reportadas voluntariamente"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniStat icon={<Share2 className="size-4" aria-hidden />} label="Enseñanzas compartidas (mes)" value={monthTotals.teaching_shared} />
          <MiniStat icon={<Eye className="size-4" aria-hidden />} label="Visitas reportadas (mes)" value={monthTotals.visit_reported} />
          <MiniStat icon={<MessageCircleHeart className="size-4" aria-hidden />} label="Decisiones de fe reportadas (mes)" value={monthTotals.faith_decision_reported} />
        </div>
      </section>

      {/* Gráficas locales */}
      <section aria-labelledby="graficas" className="flex flex-col gap-4">
        <h2 id="graficas" className="text-2xl font-semibold">
          Evolución y proyecciones
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Actividad por día"
            description="Últimos 30 días."
            series={activitySeries}
            rows={last30}
            labelKey="date"
            labelFormat={formatShortDate}
            empty={!hasActivity ? <EmptyChart /> : undefined}
          >
            <StackedBars rows={last30} series={activitySeries} xKey="date" xFormat={formatShortDate} />
          </ChartCard>

          <ChartCard
            title="Tendencia y proyección de cierre del mes"
            description="Total acumulado de actividades. La línea punteada es una estimación según tu promedio diario."
            series={[
              { key: "real", label: "Registrado", color: "#2F6DB0" },
              { key: "proyeccion", label: "Proyección (estimación)", color: "#C2861F", dashed: true },
            ]}
            rows={trendRows}
            labelKey="date"
            labelFormat={formatShortDate}
            empty={!hasActivity ? <EmptyChart /> : undefined}
          >
            <TrendLines
              rows={trendRows}
              xKey="date"
              series={[
                { key: "real", label: "Registrado", color: "#2F6DB0" },
                { key: "proyeccion", label: "Proyección (estimación)", color: "#C2861F", dashed: true },
              ]}
            />
          </ChartCard>

          <ChartCard
            title="Comparación entre períodos"
            description={
              <span className="inline-flex flex-wrap items-center gap-2">
                Totales por {compare === "week" ? "semana (8 semanas)" : "mes (6 meses)"}.
                <span role="group" aria-label="Agrupar por" className="inline-flex gap-1">
                  {(["week", "month"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={compare === k}
                      onClick={() => setCompare(k)}
                      className={`min-h-9 rounded-full px-3 text-xs font-bold ${compare === k ? "bg-navy text-white" : "border border-line bg-surface text-navy"}`}
                    >
                      {k === "week" ? "Semanal" : "Mensual"}
                    </button>
                  ))}
                </span>
              </span>
            }
            series={activitySeries}
            rows={compareRows}
            labelKey="label"
            empty={!hasActivity ? <EmptyChart /> : undefined}
          >
            <StackedBars rows={compareRows} series={activitySeries} xKey="label" />
          </ChartCard>

          <ChartCard
            title="Distribución por tipo de actividad"
            description="Todo el historial registrado."
            series={activitySeries}
            rows={distribution}
            labelKey="label"
            empty={!hasActivity ? <EmptyChart /> : undefined}
          >
            <StackedBars rows={distribution} series={activitySeries} xKey="label" layout="vertical" />
          </ChartCard>

          <ChartCard
            title="Progreso de metas vigentes"
            description="Porcentaje alcanzado (máximo 100 %)."
            series={[{ key: "progreso", label: "Progreso %", color: "#2E8A63" }]}
            rows={goalRows}
            labelKey="label"
            empty={
              goalRows.length === 0 ? (
                <span>
                  No hay metas vigentes. <Link href="/metas/" className="font-bold text-navy underline">Crea una meta</Link>.
                </span>
              ) : undefined
            }
          >
            <StackedBars rows={goalRows} series={[{ key: "progreso", label: "Progreso %", color: "#2E8A63" }]} xKey="label" layout="vertical" stacked={false} />
          </ChartCard>
        </div>
      </section>

      {/* Metas frente a resultados */}
      {activeGoals.length > 0 && (
        <section aria-labelledby="metas-vigentes" className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-2">
            <h2 id="metas-vigentes" className="text-2xl font-semibold">
              Metas frente a resultados
            </h2>
            <Link href="/metas/" className={buttonClass("ghost", "sm")}>
              Gestionar metas
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeGoals.slice(0, 6).map((g) => (
              <GoalCard key={g.id} goal={g} activities={activities} qrHistory={qrHistory} compact />
            ))}
          </div>
        </section>
      )}


      <aside className="rounded-2xl border border-line bg-surface p-5 text-sm text-muted">
        <p className="flex items-center gap-2 font-bold text-navy-ink">
          <BookCheck className="size-4" aria-hidden /> Sobre estos indicadores
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Representan actividades reportadas, no una medición del valor espiritual de ninguna persona.</li>
          <li>Una visita no equivale a una conversión, y un escaneo no equivale a una persona única.</li>
          <li>Las decisiones de fe solo se registran cuando la persona las comunicó voluntariamente.</li>
          <li>Las proyecciones son estimaciones basadas exclusivamente en los datos registrados.</li>
          <li>Esto no es una competencia: cada persona es amada por Dios y responde con libertad.</li>
        </ul>
      </aside>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
      <span className="text-navy">{icon}</span>
      <span className="flex-1 text-sm text-muted">{label}</span>
      <span className="font-serif text-xl font-semibold text-navy-ink tabular-nums">{fmt.int(value)}</span>
    </div>
  );
}

function EmptyChart() {
  return (
    <span>
      Aún no hay registros. <Link href="/actividades/" className="font-bold text-navy underline">Registra tu primera actividad</Link> y aquí verás
      tu evolución.
    </span>
  );
}

