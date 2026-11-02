"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleSlash, Loader2 } from "lucide-react";
import type { CategoryId } from "@/types";
import { Button } from "@/components/ui/Button";
import { InterestPrompt } from "@/features/interest/InterestPrompt";
import type { CompletionsApi, InterestResponse } from "./api";
import { completionsApi, getSessionId } from "./client";

/** Segundos mínimos de lectura antes de habilitar el botón (fricción ligera contra abuso). */
export const MIN_READ_SECONDS = 12;

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; completionId: string; sessionId: string; response: InterestResponse | null; duplicate: boolean }
  | { kind: "limited" }
  | { kind: "error"; message: string };

export function CompletionPanel({
  teachingId,
  qrId,
  category,
  onAnother,
  api = completionsApi,
  minReadSeconds = MIN_READ_SECONDS,
}: {
  teachingId: string;
  qrId: string | null;
  category?: CategoryId;
  onAnother?: () => void;
  api?: CompletionsApi;
  minReadSeconds?: number;
}) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [ready, setReady] = useState(minReadSeconds <= 0);
  const [reachedEnd, setReachedEnd] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ready) return;
    const t = setTimeout(() => setReady(true), minReadSeconds * 1000);
    return () => clearTimeout(t);
  }, [ready, minReadSeconds]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || reachedEnd || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setReachedEnd(true);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [reachedEnd]);

  const enabled = ready || reachedEnd;

  if (!api.configured) {
    return (
      <div className="card flex flex-col items-center gap-3 p-6 text-center">
        <Button size="lg" variant="secondary" disabled icon={<CircleSlash className="size-5" aria-hidden />}>
          He completado esta enseñanza
        </Button>
        <p className="max-w-md text-sm text-muted">
          El registro global de enseñanzas completadas no está configurado en este sitio, así que no se guardará ninguna
          finalización. Puedes seguir leyendo y compartiendo con total libertad.
        </p>
      </div>
    );
  }

  async function complete() {
    setState({ kind: "sending" });
    const sessionId = getSessionId();
    const res = await api.registerCompletion({ teachingId, sessionId, qrId });
    switch (res.status) {
      case "registered":
        setState({ kind: "done", completionId: res.completionId, sessionId, response: null, duplicate: false });
        break;
      case "duplicate":
        setState({ kind: "done", completionId: res.completionId, sessionId, response: res.response, duplicate: true });
        break;
      case "rate_limited":
        setState({ kind: "limited" });
        break;
      case "invalid":
        setState({ kind: "error", message: "No fue posible registrar esta enseñanza." });
        break;
      case "not_configured":
        setState({ kind: "error", message: "El registro global no está disponible." });
        break;
      default:
        setState({ kind: "error", message: "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo." });
    }
  }

  return (
    <div className="card flex flex-col items-center gap-4 p-6 text-center sm:p-8">
      <div ref={sentinel} aria-hidden className="h-px w-px" />
      {state.kind === "done" ? (
        <>
          <div className="flex flex-col items-center gap-2 animate-fade-up" role="status">
            <CheckCircle2 className="size-12 text-hope-ink" aria-hidden />
            <p className="font-serif text-2xl font-semibold text-navy-ink">
              {state.duplicate ? "Ya habías completado esta enseñanza" : "¡Gracias por completar esta enseñanza!"}
            </p>
            <p className="text-sm text-muted">Quedó registrada como una finalización anónima.</p>
          </div>
          <Button size="md" variant="secondary" disabled icon={<CheckCircle2 className="size-5" aria-hidden />}>
            Enseñanza completada
          </Button>
          <hr className="my-2 w-full border-line" />
          <InterestPrompt
            api={api}
            completionId={state.completionId}
            sessionId={state.sessionId}
            initialResponse={state.response}
            currentCategory={category}
            onAnother={onAnother}
          />
        </>
      ) : (
        <>
          <p className="font-serif text-xl text-navy-ink">¿Terminaste de leer?</p>
          <Button
            size="lg"
            variant="primary"
            disabled={!enabled || state.kind === "sending" || state.kind === "limited"}
            onClick={complete}
            icon={
              state.kind === "sending" ? (
                <Loader2 className="size-5 animate-spin" aria-hidden />
              ) : (
                <CheckCircle2 className="size-5" aria-hidden />
              )
            }
          >
            He completado esta enseñanza
          </Button>
          {!enabled && <p className="text-sm text-muted">Tómate un momento para leer con calma; el botón se activará en unos segundos.</p>}
          <p className="max-w-md text-xs text-muted">
            Es voluntario y anónimo: no pedimos nombre, correo ni teléfono. Completar una enseñanza no significa ningún compromiso religioso.
          </p>
          {state.kind === "limited" && (
            <p role="alert" className="text-sm font-semibold text-rose-ink">
              Se alcanzó el límite de registros por ahora. Gracias por tu interés; intenta más tarde.
            </p>
          )}
          {state.kind === "error" && (
            <p role="alert" className="text-sm font-semibold text-rose-ink">
              {state.message}
            </p>
          )}
        </>
      )}
    </div>
  );
}
