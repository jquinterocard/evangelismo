"use client";

import { useId, useState } from "react";
import { FileSpreadsheet, Pencil, Trash2 } from "lucide-react";
import type { Activity, ActivityType } from "@/types";
import { ACTIVITY_TYPES } from "@/types";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useStore, useHydrated } from "@/hooks/useStore";
import { activitiesStore } from "@/lib/stores";
import { downloadText, toCsv } from "@/lib/backup";
import { formatDate } from "@/lib/dates";
import { fmt } from "@/features/impact/projections";
import { ActivityForm } from "./ActivityForm";
import { ACTIVITY_COLORS, ACTIVITY_LABELS, filterActivities, totalsInRange } from "./model";

const PAGE = 25;

export function activitiesCsv(list: Activity[]): string {
  return toCsv(
    ["fecha", "tipo", "cantidad", "descripcion", "observaciones", "creado", "actualizado"],
    list.map((a) => [a.date, ACTIVITY_LABELS[a.type], a.quantity, a.description ?? "", a.notes ?? "", a.createdAt, a.updatedAt]),
  );
}

export function ActivityManager() {
  const all = useStore(activitiesStore);
  const hydrated = useHydrated();
  const toast = useToast();
  const id = useId();
  const [editing, setEditing] = useState<Activity | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState<ActivityType | "all">("all");
  const [limit, setLimit] = useState(PAGE);

  const list = filterActivities(all, { from: from || undefined, to: to || undefined, type });
  const totals = totalsInRange(list);

  function remove(a: Activity) {
    if (!window.confirm(`¿Eliminar el registro de ${ACTIVITY_LABELS[a.type].toLowerCase()} del ${formatDate(a.date)}?`)) return;
    const w = activitiesStore.update((l) => l.filter((x) => x.id !== a.id));
    toast(w.ok ? "Registro eliminado." : w.message, w.ok ? "success" : "error");
    if (editing?.id === a.id) setEditing(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
      <div className="lg:sticky lg:top-20 lg:self-start">
        <ActivityForm key={editing?.id ?? "new"} editing={editing} onDone={() => setEditing(null)} />
      </div>

      <section className="flex flex-col gap-4" aria-labelledby={`${id}-h`}>
        <h2 id={`${id}-h`} className="text-2xl font-semibold">
          Historial de actividades
        </h2>
        <div className="card grid gap-3 p-4 sm:grid-cols-3">
          <div>
            <label htmlFor={`${id}-from`} className="label">
              Desde
            </label>
            <input id={`${id}-from`} type="date" className="field" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label htmlFor={`${id}-to`} className="label">
              Hasta
            </label>
            <input id={`${id}-to`} type="date" className="field" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label htmlFor={`${id}-type`} className="label">
              Tipo
            </label>
            <select id={`${id}-type`} className="field" value={type} onChange={(e) => setType(e.target.value as ActivityType | "all")}>
              <option value="all">Todos</option>
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ACTIVITY_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hydrated && all.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" aria-live="polite">
            {ACTIVITY_TYPES.filter((t) => totals[t] > 0).map((t) => (
              <span key={t} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm">
                <span className="size-2.5 rounded-full" style={{ background: ACTIVITY_COLORS[t] }} aria-hidden />
                {ACTIVITY_LABELS[t]}: <strong className="tabular-nums">{fmt.int(totals[t])}</strong>
              </span>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              disabled={list.length === 0}
              onClick={() => downloadText(activitiesCsv(list), `actividades-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8")}
              icon={<FileSpreadsheet className="size-4" aria-hidden />}
            >
              Exportar CSV
            </Button>
          </div>
        )}

        {!hydrated ? (
          <div className="card h-40 animate-pulse" aria-hidden />
        ) : list.length === 0 ? (
          <EmptyState
            title={all.length === 0 ? "Aún no hay actividades" : "Ningún registro coincide con el filtro"}
            description={
              all.length === 0
                ? "Registra tu primera actividad: cada QR compartido es una semilla de esperanza."
                : "Ajusta las fechas o el tipo de actividad."
            }
            illustration="seed"
          />
        ) : (
          <>
            <ul className="flex flex-col gap-2">
              {list.slice(0, limit).map((a) => (
                <li key={a.id} className="card flex items-start gap-3 p-4">
                  <span className="mt-1.5 size-3 shrink-0 rounded-full" style={{ background: ACTIVITY_COLORS[a.type] }} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-navy-ink">
                      {ACTIVITY_LABELS[a.type]} · <span className="tabular-nums">{fmt.int(a.quantity)}</span>
                    </p>
                    <p className="text-sm text-muted">{formatDate(a.date)}</p>
                    {a.description && <p className="mt-1 break-words">{a.description}</p>}
                    {a.notes && <p className="mt-1 text-sm break-words whitespace-pre-line text-muted">{a.notes}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      className="grid size-11 place-items-center rounded-full text-navy hover:bg-sky-soft"
                      aria-label={`Editar ${ACTIVITY_LABELS[a.type]} del ${formatDate(a.date)}`}
                      onClick={() => {
                        setEditing(a);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      <Pencil className="size-5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="grid size-11 place-items-center rounded-full text-rose-ink hover:bg-rose/40"
                      aria-label={`Eliminar ${ACTIVITY_LABELS[a.type]} del ${formatDate(a.date)}`}
                      onClick={() => remove(a)}
                    >
                      <Trash2 className="size-5" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {list.length > limit && (
              <Button variant="secondary" onClick={() => setLimit((l) => l + PAGE)}>
                Ver más ({list.length - limit} restantes)
              </Button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
