"use client";

import Link from "next/link";
import { Check, Circle, RotateCcw } from "lucide-react";
import { learningPath } from "@/data/learning-path";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { useHydrated, useStore } from "@/hooks/useStore";
import { learningStore } from "@/lib/stores";

export function toggleTopic(slug: string, done: boolean) {
  return learningStore.update((p) => ({
    completed: done ? [...new Set([...p.completed, slug])] : p.completed.filter((s) => s !== slug),
  }));
}

/** Lista de temas con progreso local (opcional, sin datos personales). */
export function LearningOverview() {
  const progress = useStore(learningStore);
  const hydrated = useHydrated();
  const done = new Set(hydrated ? progress.completed : []);
  const count = learningPath.filter((t) => done.has(t.slug)).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="card flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold text-navy-ink">
            Tu recorrido: {count} de {learningPath.length} temas leídos
          </p>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCcw className="size-4" aria-hidden />}
              onClick={() => window.confirm("¿Reiniciar tu progreso en la ruta?") && learningStore.clear()}
            >
              Reiniciar
            </Button>
          )}
        </div>
        <ProgressBar value={count} max={learningPath.length} label="Progreso en la ruta Conociendo a Jesús" />
        <p className="text-sm text-muted">
          Avanza a tu ritmo y en el orden que quieras. El progreso se guarda solo en este navegador.
        </p>
      </div>
      <ol className="grid gap-3 md:grid-cols-2">
        {learningPath.map((t) => {
          const isDone = done.has(t.slug);
          return (
            <li key={t.slug}>
              <Link
                href={`/conociendo-a-jesus/${t.slug}/`}
                className={`card flex h-full items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:border-gold ${isDone ? "bg-hope-soft/50" : ""}`}
              >
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-full font-serif text-lg font-semibold ${
                    isDone ? "bg-hope text-white" : "bg-gold-soft text-gold-ink"
                  }`}
                >
                  {isDone ? <Check className="size-5" aria-hidden /> : t.order}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-lg font-semibold text-navy-ink">{t.title}</span>
                  <span className="text-sm text-muted">{t.summary}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-muted">
                    {isDone ? (
                      <>
                        <Check className="size-3.5" aria-hidden /> Leído
                      </>
                    ) : (
                      <>
                        <Circle className="size-3.5" aria-hidden /> Pendiente
                      </>
                    )}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function MarkTopicRead({ slug }: { slug: string }) {
  const progress = useStore(learningStore);
  const hydrated = useHydrated();
  const done = hydrated && progress.completed.includes(slug);
  return (
    <Button
      size="lg"
      variant={done ? "secondary" : "primary"}
      aria-pressed={done}
      onClick={() => toggleTopic(slug, !done)}
      icon={done ? <Check className="size-5" aria-hidden /> : <Circle className="size-5" aria-hidden />}
    >
      {done ? "Marcado como leído" : "Marcar como leído"}
    </Button>
  );
}
