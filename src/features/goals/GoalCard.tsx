"use client";

import { CalendarDays, Pencil, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import type { Activity, Goal, GoalStatus, QrRecord } from "@/types";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { daysInclusive, formatShortDate, previousRange, todayISO } from "@/lib/dates";
import { fmt, percentChange } from "@/features/impact/projections";
import { useGlobalDaily } from "@/features/completions/useGlobalStats";
import { goalProgress, isGlobalMetric, METRIC_LABELS, PERIOD_LABELS, STATUS_LABELS } from "./model";

const statusStyle: Record<GoalStatus, string> = {
  upcoming: "bg-sky text-navy",
  active: "bg-gold-soft text-gold-ink",
  achieved: "bg-hope-soft text-hope-ink",
  ended: "bg-line text-muted",
};

export function GoalCard({
  goal,
  activities,
  qrHistory,
  onEdit,
  onDelete,
  compact = false,
}: {
  goal: Goal;
  activities: Activity[];
  qrHistory: QrRecord[];
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}) {
  const global = isGlobalMetric(goal.metric);
  const prev = previousRange({ start: goal.startDate, end: goal.endDate });
  // Para indicadores globales se consulta desde el inicio del período anterior (máx. 400 días).
  const fetchFrom = daysInclusive(prev.start, goal.endDate) <= 401 ? prev.start : goal.startDate;
  const globalState = useGlobalDaily(global ? fetchFrom : "", global ? goal.endDate : "");
  const globalData = global && globalState.status === "ready" ? globalState.data : null;
  const today = todayISO();
  const p = goalProgress(goal, { activities, qrHistory, global: globalData }, today);
  const change = p.current !== null && p.previous !== null ? percentChange(p.current, p.previous) : null;

  return (
    <article className="card flex flex-col gap-3 p-5" aria-labelledby={`g-${goal.id}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 id={`g-${goal.id}`} className="text-lg leading-snug font-semibold break-words">
            {goal.name}
          </h3>
          <p className="text-sm text-muted">
            {METRIC_LABELS[goal.metric]} · {PERIOD_LABELS[goal.period]}
          </p>
        </div>
        {p.status && <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusStyle[p.status]}`}>{STATUS_LABELS[p.status]}</span>}
      </div>
      {!compact && goal.description && <p className="text-sm break-words text-muted">{goal.description}</p>}

      {p.current === null || !p.projection ? (
        <p className="rounded-xl bg-sky-soft p-3 text-sm text-navy-ink">
          {globalState.status === "not_configured"
            ? "Indicador global no disponible: el registro global no está configurado en este sitio."
            : globalState.status === "error"
              ? "No se pudieron cargar los datos globales. Intenta más tarde."
              : "Cargando datos globales…"}
        </p>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-serif text-2xl font-semibold text-navy-ink tabular-nums">
              {fmt.int(p.current)} <span className="text-base font-normal text-muted">/ {fmt.int(goal.target)}</span>
            </p>
            <p className="font-bold text-navy tabular-nums">{fmt.pct(Math.min(999, p.projection.percent))}</p>
          </div>
          <ProgressBar value={p.current} max={goal.target} label={`Progreso de ${goal.name}`} tone={p.status === "achieved" ? "hope" : "gold"} />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt className="text-muted">Pendiente</dt>
              <dd className="font-bold tabular-nums">{fmt.int(p.projection.pending)}</dd>
            </div>
            <div>
              <dt className="text-muted">Días restantes</dt>
              <dd className="font-bold tabular-nums">{p.projection.daysRemaining}</dd>
            </div>
            {!compact && (
              <>
                <div>
                  <dt className="text-muted">Promedio diario</dt>
                  <dd className="font-bold tabular-nums">{fmt.dec(p.projection.dailyAverage)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Ritmo necesario</dt>
                  <dd className="font-bold tabular-nums">
                    {p.projection.requiredPace === null ? "—" : `${fmt.dec(p.projection.requiredPace)} / día`}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted">{p.projection.isEstimate ? "Proyección al cierre (estimación)" : "Resultado final"}</dt>
                  <dd className="font-bold tabular-nums">
                    ≈ {fmt.int(p.projection.projectedTotal)}
                    {p.projection.isEstimate && p.projection.daysElapsed > 0 && (
                      <span className="ml-2 font-normal text-muted">{p.projection.onTrack ? "· a buen ritmo" : "· por debajo de la meta"}</span>
                    )}
                  </dd>
                </div>
              </>
            )}
          </dl>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-4" aria-hidden /> {formatShortDate(goal.startDate)} – {formatShortDate(goal.endDate)}
            </span>
            {p.previous !== null && (
              <span className="inline-flex items-center gap-1">
                {change !== null && change < 0 ? <TrendingDown className="size-4" aria-hidden /> : <TrendingUp className="size-4" aria-hidden />}
                Período anterior: {fmt.int(p.previous)}
                {change !== null && ` (${change >= 0 ? "+" : ""}${fmt.pct(change)})`}
              </span>
            )}
          </div>
        </>
      )}

      {(onEdit || onDelete) && (
        <div className="mt-1 flex justify-end gap-1 border-t border-line pt-2">
          {onEdit && (
            <button type="button" onClick={onEdit} className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-bold text-navy hover:bg-sky-soft">
              <Pencil className="size-4" aria-hidden /> Editar
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={onDelete} className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-bold text-rose-ink hover:bg-rose/40">
              <Trash2 className="size-4" aria-hidden /> Eliminar
            </button>
          )}
        </div>
      )}
    </article>
  );
}
