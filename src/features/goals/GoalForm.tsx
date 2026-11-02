"use client";

import { useId, useState } from "react";
import { Plus, Save, X } from "lucide-react";
import type { Goal, GoalMetric, GoalPeriod } from "@/types";
import { GOAL_METRICS, GOAL_PERIODS } from "@/types";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { goalsStore } from "@/lib/stores";
import { LIMITS } from "@/lib/schemas";
import { periodRange, todayISO } from "@/lib/dates";
import { completionsApi } from "@/features/completions/client";
import { buildGoal, isGlobalMetric, METRIC_LABELS, PERIOD_LABELS } from "./model";

interface Draft {
  name: string;
  description: string;
  metric: GoalMetric;
  target: string;
  period: GoalPeriod;
  startDate: string;
  endDate: string;
}

function toDraft(g?: Goal): Draft {
  const r = periodRange("weekly", todayISO());
  return {
    name: g?.name ?? "",
    description: g?.description ?? "",
    metric: g?.metric ?? "qr_shared",
    target: g ? String(g.target) : "50",
    period: g?.period ?? "weekly",
    startDate: g?.startDate ?? r.start,
    endDate: g?.endDate ?? r.end,
  };
}

export const GOAL_EXAMPLES = [
  "Compartir 50 QR durante una semana",
  "Alcanzar 200 visitas reportadas durante un mes",
  "Compartir 500 enseñanzas durante un trimestre",
];

export function GoalForm({ editing, onDone }: { editing?: Goal | null; onDone?: () => void }) {
  const id = useId();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(() => toDraft(editing ?? undefined));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  function changePeriod(period: GoalPeriod) {
    if (period === "custom") return set("period", period);
    const r = periodRange(period, todayISO());
    setDraft((d) => ({ ...d, period, startDate: r.start, endDate: r.end }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const target = Number(draft.target);
    const res = buildGoal(
      { ...draft, target: Number.isFinite(target) ? target : NaN, description: draft.description || undefined },
      editing ?? undefined,
    );
    if (!res.ok) return setErrors(res.errors);
    const w = goalsStore.update((list) => (editing ? list.map((g) => (g.id === editing.id ? res.value : g)) : [res.value, ...list]));
    if (!w.ok) return toast(w.message, "error");
    toast(editing ? "Meta actualizada." : "Meta creada. ¡Que Dios bendiga este propósito!");
    setErrors({});
    setDraft(toDraft());
    onDone?.();
  }

  const err = (k: string) =>
    errors[k] ? (
      <p id={`${id}-${k}-e`} className="mt-1 text-sm font-semibold text-rose-ink">
        {errors[k]}
      </p>
    ) : null;

  return (
    <form onSubmit={submit} noValidate className="card flex flex-col gap-4 p-5 sm:p-6" aria-labelledby={`${id}-t`}>
      <h2 id={`${id}-t`} className="text-xl font-semibold">
        {editing ? "Editar meta" : "Nueva meta"}
      </h2>
      <div>
        <label htmlFor={`${id}-name`} className="label">
          Nombre
        </label>
        <input
          id={`${id}-name`}
          className="field"
          maxLength={LIMITS.name}
          value={draft.name}
          placeholder={GOAL_EXAMPLES[0]}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? `${id}-name-e` : undefined}
          onChange={(e) => set("name", e.target.value)}
        />
        {err("name")}
      </div>
      <div>
        <label htmlFor={`${id}-desc`} className="label">
          Descripción <span className="font-normal text-muted">(opcional)</span>
        </label>
        <textarea
          id={`${id}-desc`}
          className="field min-h-20"
          maxLength={LIMITS.description}
          value={draft.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <div>
        <label htmlFor={`${id}-metric`} className="label">
          Indicador
        </label>
        <select id={`${id}-metric`} className="field" value={draft.metric} onChange={(e) => set("metric", e.target.value as GoalMetric)}>
          {GOAL_METRICS.map((m) => (
            <option key={m} value={m}>
              {METRIC_LABELS[m]}
            </option>
          ))}
        </select>
        {isGlobalMetric(draft.metric) && (
          <p className="mt-1 text-sm text-muted">
            {completionsApi.configured
              ? "Se calcula con las finalizaciones y respuestas registradas globalmente en el sitio (no son personas únicas)."
              : "Requiere el registro global (Supabase), que no está configurado en este sitio."}
          </p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-target`} className="label">
            Cantidad objetivo
          </label>
          <input
            id={`${id}-target`}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            className="field"
            value={draft.target}
            aria-invalid={!!errors.target}
            aria-describedby={errors.target ? `${id}-target-e` : undefined}
            onChange={(e) => set("target", e.target.value)}
          />
          {err("target")}
        </div>
        <div>
          <label htmlFor={`${id}-period`} className="label">
            Período
          </label>
          <select id={`${id}-period`} className="field" value={draft.period} onChange={(e) => changePeriod(e.target.value as GoalPeriod)}>
            {GOAL_PERIODS.map((p) => (
              <option key={p} value={p}>
                {PERIOD_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-start`} className="label">
            Fecha de inicio
          </label>
          <input
            id={`${id}-start`}
            type="date"
            className="field"
            value={draft.startDate}
            onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value, period: "custom" }))}
          />
          {err("startDate")}
        </div>
        <div>
          <label htmlFor={`${id}-end`} className="label">
            Fecha de finalización
          </label>
          <input
            id={`${id}-end`}
            type="date"
            className="field"
            value={draft.endDate}
            aria-invalid={!!errors.endDate}
            aria-describedby={errors.endDate ? `${id}-endDate-e` : undefined}
            onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value, period: "custom" }))}
          />
          {err("endDate")}
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" size="lg" icon={editing ? <Save className="size-5" aria-hidden /> : <Plus className="size-5" aria-hidden />}>
          {editing ? "Guardar cambios" : "Crear meta"}
        </Button>
        {editing && (
          <Button variant="ghost" size="lg" onClick={onDone} icon={<X className="size-5" aria-hidden />}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
