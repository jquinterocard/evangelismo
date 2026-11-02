"use client";

import { useState } from "react";
import type { Goal } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useHydrated, useStore } from "@/hooks/useStore";
import { activitiesStore, goalsStore, qrHistoryStore } from "@/lib/stores";
import { todayISO } from "@/lib/dates";
import { GoalCard } from "./GoalCard";
import { GOAL_EXAMPLES, GoalForm } from "./GoalForm";

export function GoalManager() {
  const goals = useStore(goalsStore);
  const activities = useStore(activitiesStore);
  const qrHistory = useStore(qrHistoryStore);
  const hydrated = useHydrated();
  const toast = useToast();
  const [editing, setEditing] = useState<Goal | null>(null);
  const [filter, setFilter] = useState<"all" | "current" | "past">("current");
  const today = todayISO();

  const shown = goals
    .filter((g) => (filter === "all" ? true : filter === "current" ? g.endDate >= today : g.endDate < today))
    .sort((a, b) => a.endDate.localeCompare(b.endDate));

  function remove(g: Goal) {
    if (!window.confirm(`¿Eliminar la meta «${g.name}»?`)) return;
    const w = goalsStore.update((l) => l.filter((x) => x.id !== g.id));
    toast(w.ok ? "Meta eliminada." : w.message, w.ok ? "success" : "error");
    if (editing?.id === g.id) setEditing(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
      <div className="lg:sticky lg:top-20 lg:self-start">
        <GoalForm key={editing?.id ?? "new"} editing={editing} onDone={() => setEditing(null)} />
      </div>
      <section className="flex flex-col gap-4" aria-label="Mis metas">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar metas">
          {(
            [
              ["current", "Vigentes"],
              ["past", "Anteriores"],
              ["all", "Todas"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={filter === k}
              onClick={() => setFilter(k)}
              className={`min-h-11 rounded-full px-4 text-sm font-bold ${filter === k ? "bg-navy text-white" : "border border-line bg-surface text-navy"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {!hydrated ? (
          <div className="card h-40 animate-pulse" aria-hidden />
        ) : shown.length === 0 ? (
          <EmptyState
            title={goals.length === 0 ? "Aún no tienes metas" : "No hay metas en esta vista"}
            illustration="path"
            description={
              goals.length === 0 ? (
                <>
                  <p>Define un propósito concreto para compartir el evangelio. Por ejemplo:</p>
                  <ul className="mt-2 list-inside list-disc text-left">
                    {GOAL_EXAMPLES.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </>
              ) : (
                "Cambia el filtro para ver otras metas."
              )
            }
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {shown.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                activities={activities}
                qrHistory={qrHistory}
                onEdit={() => {
                  setEditing(g);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onDelete={() => remove(g)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

