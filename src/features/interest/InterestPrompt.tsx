"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Heart, Home, RefreshCw } from "lucide-react";
import type { CategoryId } from "@/types";
import { categories } from "@/data/categories";
import { Button, buttonClass } from "@/components/ui/Button";
import { Dove } from "@/components/illustrations";
import type { CompletionsApi, InterestResponse } from "@/features/completions/api";

const RECOMMENDED: CategoryId[] = ["amor-de-dios", "salvacion", "oracion", "esperanza", "perdon", "paz"];

export function recommendedCategories(current?: CategoryId) {
  return RECOMMENDED.filter((c) => c !== current)
    .slice(0, 3)
    .map((id) => categories.find((c) => c.id === id)!);
}

type State =
  | { kind: "asking"; error?: string }
  | { kind: "sending"; choice: InterestResponse }
  | { kind: "answered"; choice: InterestResponse; recorded: boolean };

/**
 * Pregunta voluntaria tras una finalización registrada globalmente.
 * Sin presión: ambas opciones tienen el mismo peso y se puede omitir.
 */
export function InterestPrompt({
  api,
  completionId,
  sessionId,
  initialResponse = null,
  currentCategory,
  onAnother,
}: {
  api: CompletionsApi;
  completionId: string;
  sessionId: string;
  initialResponse?: InterestResponse | null;
  currentCategory?: CategoryId;
  onAnother?: () => void;
}) {
  const [state, setState] = useState<State>(
    initialResponse ? { kind: "answered", choice: initialResponse, recorded: true } : { kind: "asking" },
  );

  async function answer(choice: InterestResponse) {
    setState({ kind: "sending", choice });
    const res = await api.registerInterest({ completionId, sessionId, response: choice });
    if (res.status === "registered" || res.status === "duplicate") {
      setState({ kind: "answered", choice: res.response, recorded: true });
    } else if (res.status === "invalid" || res.status === "not_configured") {
      setState({ kind: "answered", choice, recorded: false });
    } else {
      setState({ kind: "asking", error: "No pudimos guardar tu respuesta por un problema de conexión. Puedes intentarlo de nuevo o simplemente continuar." });
    }
  }

  if (state.kind === "answered") {
    return (
      <div className="animate-fade-up" aria-live="polite">
        {state.choice === "positive" && <PositiveFollowUp currentCategory={currentCategory} onAnother={onAnother} />}
        {state.choice === "negative" && <NegativeFollowUp />}
        {state.choice === "skipped" && (
          <p className="text-center text-muted">Está bien. Gracias por leer; aquí estaremos cuando quieras volver.</p>
        )}
        {!state.recorded && (
          <p className="mt-3 text-center text-sm text-muted">Tu respuesta no pudo registrarse en las estadísticas globales.</p>
        )}
      </div>
    );
  }

  const sending = state.kind === "sending";
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h3 className="text-2xl font-semibold">❤️ ¿Te gustaría seguir conociendo a Jesús?</h3>
      <p className="max-w-md text-muted">Es completamente opcional. Tu respuesta es anónima y no te pediremos ningún dato.</p>
      <div className="grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
        <Button size="lg" variant="primary" disabled={sending} onClick={() => answer("positive")}>
          Sí, quiero aprender más ❤️
        </Button>
        <Button size="lg" variant="secondary" disabled={sending} onClick={() => answer("negative")}>
          Por ahora no, gracias
        </Button>
      </div>
      <button
        type="button"
        disabled={sending}
        onClick={() => answer("skipped")}
        className="min-h-11 px-3 text-sm font-semibold text-muted underline underline-offset-4 hover:text-navy disabled:opacity-50"
      >
        Omitir pregunta
      </button>
      {state.kind === "asking" && state.error && (
        <p role="alert" className="text-sm font-semibold text-rose-ink">
          {state.error}
        </p>
      )}
    </div>
  );
}

export function PositiveFollowUp({ currentCategory, onAnother }: { currentCategory?: CategoryId; onAnother?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <Heart className="size-10 fill-rose text-rose-ink" aria-hidden />
      <p className="max-w-xl font-serif text-xl leading-relaxed text-navy-ink">
        ¡Qué alegría que quieras seguir aprendiendo! ❤️ Cada enseñanza es una oportunidad para descubrir más sobre la vida, el amor y las palabras de Jesús.
      </p>
      <div className="flex w-full max-w-lg flex-col gap-3 sm:flex-row">
        <Link href="/conociendo-a-jesus/" className={buttonClass("gold", "lg", "flex-1")}>
          Ruta «Conociendo a Jesús» <ArrowRight className="size-5" aria-hidden />
        </Link>
        {onAnother ? (
          <Button size="lg" variant="secondary" className="flex-1" onClick={onAnother} icon={<RefreshCw className="size-5" aria-hidden />}>
            Otra enseñanza
          </Button>
        ) : (
          <Link href="/ensenanza/" className={buttonClass("secondary", "lg", "flex-1")}>
            <RefreshCw className="size-5" aria-hidden /> Otra enseñanza
          </Link>
        )}
      </div>
      <div className="w-full max-w-lg">
        <p className="mb-2 text-sm font-bold text-muted">Temas recomendados</p>
        <ul className="grid gap-2 sm:grid-cols-3">
          {recommendedCategories(currentCategory).map((c) => (
            <li key={c.id}>
              <Link
                href={`/ensenanzas/?categoria=${c.id}`}
                className="flex min-h-12 items-center justify-center rounded-xl border border-line bg-white px-3 text-sm font-bold text-navy hover:border-navy"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function NegativeFollowUp() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Dove className="h-16 w-auto" />
      <p className="max-w-xl font-serif text-xl leading-relaxed text-navy-ink">
        Gracias por dedicar un momento a leer esta enseñanza. Que tengas un día lleno de paz y esperanza. 🕊️
      </p>
      <p className="text-sm text-muted">Puedes cerrar esta página cuando quieras.</p>
      <Link href="/" className={buttonClass("ghost", "md")}>
        <Home className="size-5" aria-hidden /> Volver al inicio
      </Link>
    </div>
  );
}
