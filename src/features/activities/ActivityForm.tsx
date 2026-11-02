"use client";

import { useId, useState } from "react";
import { Plus, Save, X } from "lucide-react";
import type { Activity, ActivityType } from "@/types";
import { ACTIVITY_TYPES } from "@/types";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { activitiesStore } from "@/lib/stores";
import { LIMITS } from "@/lib/schemas";
import { todayISO } from "@/lib/dates";
import { ACTIVITY_HINTS, ACTIVITY_LABELS, buildActivity } from "./model";

interface Draft {
  date: string;
  type: ActivityType;
  quantity: string;
  description: string;
  notes: string;
}

function toDraft(a?: Activity): Draft {
  return {
    date: a?.date ?? todayISO(),
    type: a?.type ?? "qr_shared",
    quantity: a ? String(a.quantity) : "1",
    description: a?.description ?? "",
    notes: a?.notes ?? "",
  };
}

export function ActivityForm({ editing, onDone }: { editing?: Activity | null; onDone?: () => void }) {
  const id = useId();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(() => toDraft(editing ?? undefined));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const quantity = Number(draft.quantity);
    const res = buildActivity(
      {
        date: draft.date,
        type: draft.type,
        quantity: Number.isFinite(quantity) ? quantity : NaN,
        description: draft.description,
        notes: draft.notes,
      },
      editing ?? undefined,
    );
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    const w = activitiesStore.update((list) =>
      editing ? list.map((a) => (a.id === editing.id ? res.value : a)) : [res.value, ...list],
    );
    if (!w.ok) {
      toast(w.message, "error");
      return;
    }
    toast(editing ? "Actividad actualizada." : "Actividad registrada. ¡Gracias por sembrar esperanza!");
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
        {editing ? "Editar actividad" : "Registrar actividad"}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-date`} className="label">
            Fecha
          </label>
          <input
            id={`${id}-date`}
            type="date"
            className="field"
            value={draft.date}
            max={todayISO()}
            required
            aria-invalid={!!errors.date}
            aria-describedby={errors.date ? `${id}-date-e` : undefined}
            onChange={(e) => set("date", e.target.value)}
          />
          {err("date")}
        </div>
        <div>
          <label htmlFor={`${id}-qty`} className="label">
            Cantidad
          </label>
          <input
            id={`${id}-qty`}
            type="number"
            inputMode="numeric"
            min={1}
            max={LIMITS.maxQuantity}
            step={1}
            className="field"
            value={draft.quantity}
            required
            aria-invalid={!!errors.quantity}
            aria-describedby={errors.quantity ? `${id}-quantity-e` : undefined}
            onChange={(e) => set("quantity", e.target.value)}
          />
          {err("quantity")}
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-type`} className="label">
          Tipo de actividad
        </label>
        <select id={`${id}-type`} className="field" value={draft.type} onChange={(e) => set("type", e.target.value as ActivityType)}>
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {ACTIVITY_LABELS[t]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-muted">{ACTIVITY_HINTS[draft.type]}</p>
      </div>
      <div>
        <label htmlFor={`${id}-desc`} className="label">
          Descripción <span className="font-normal text-muted">(opcional)</span>
        </label>
        <input
          id={`${id}-desc`}
          type="text"
          className="field"
          maxLength={LIMITS.description}
          placeholder="Ej.: entrega de tarjetas en el parque"
          value={draft.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <div>
        <label htmlFor={`${id}-notes`} className="label">
          Observaciones <span className="font-normal text-muted">(opcional)</span>
        </label>
        <textarea
          id={`${id}-notes`}
          className="field min-h-24"
          maxLength={LIMITS.notes}
          placeholder="Sin nombres, teléfonos ni datos personales."
          value={draft.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" size="lg" icon={editing ? <Save className="size-5" aria-hidden /> : <Plus className="size-5" aria-hidden />}>
          {editing ? "Guardar cambios" : "Registrar"}
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
