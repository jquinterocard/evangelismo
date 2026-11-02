"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { CategoryId } from "@/types";
import { Button } from "@/components/ui/Button";
import { NegativeFollowUp, PositiveFollowUp, SkippedFollowUp } from "@/features/interest/InterestPrompt";
import type { CompletionsApi, InterestResponse } from "./api";
import { completionsApi, getSessionId } from "./client";

/** Segundos mínimos de lectura antes de habilitar las opciones (fricción ligera contra abuso). */
export const MIN_READ_SECONDS = 12;

type State =
  | { kind: "asking"; error?: string }
  | { kind: "sending"; choice: InterestResponse }
  | { kind: "answered"; choice: InterestResponse; recorded: boolean; note?: string }
  | { kind: "limited" };

/**
 * Al final de cada enseñanza: «¿Te gustaría seguir conociendo a Jesús?» con tres opciones.
 * Elegir cualquiera registra, de forma anónima, la finalización y la respuesta (un solo paso).
 * Sin presión: las tres opciones tienen el mismo peso.
 */
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
  const [state, setState] = useState<State>({ kind: "asking" });
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

  // Sin registro global: las opciones funcionan como navegación, sin afirmar que algo se guardó.
  const enabled = !api.configured || ready || reachedEnd;

  async function choose(choice: InterestResponse) {
    if (!api.configured) {
      setState({ kind: "answered", choice, recorded: false });
      return;
    }
    setState({ kind: "sending", choice });
    const sessionId = getSessionId();
    const completion = await api.registerCompletion({ teachingId, sessionId, qrId });

    if (completion.status === "rate_limited") return setState({ kind: "limited" });
    if (completion.status === "invalid" || completion.status === "not_configured") {
      return setState({ kind: "answered", choice, recorded: false, note: "No fue posible registrar esta enseñanza." });
    }
    if (completion.status === "error") {
      return setState({ kind: "asking", error: "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo." });
    }
    // Ya existía una respuesta para esta finalización: se respeta (una sola por finalización).
    if (completion.status === "duplicate" && completion.response) {
      return setState({ kind: "answered", choice: completion.response, recorded: true });
    }

    const interest = await api.registerInterest({ completionId: completion.completionId, sessionId, response: choice });
    if (interest.status === "registered" || interest.status === "duplicate") {
      return setState({ kind: "answered", choice: interest.response, recorded: true });
    }
    if (interest.status === "error") {
      // La finalización quedó guardada; reintentar es seguro (ambas operaciones son idempotentes).
      return setState({ kind: "asking", error: "Tu lectura quedó registrada, pero no pudimos guardar tu respuesta. Inténtalo de nuevo." });
    }
    setState({ kind: "answered", choice, recorded: false, note: "No pudimos guardar tu respuesta." });
  }

  if (state.kind === "answered") {
    return (
      <div className="card flex flex-col items-center gap-5 p-6 text-center sm:p-8" aria-live="polite">
        <div className="flex flex-col items-center gap-2 motion-safe:animate-fade-up">
          <CheckCircle2 className="size-12 text-hope-ink" aria-hidden />
          <p className="font-serif text-2xl font-semibold text-navy-ink">¡Gracias por leer!</p>
          {state.recorded && <p className="text-sm text-muted">Tu lectura y tu respuesta quedaron registradas de forma anónima.</p>}
        </div>
        <hr className="w-full border-line" />
        {state.choice === "positive" && <PositiveFollowUp currentCategory={category} onAnother={onAnother} />}
        {state.choice === "negative" && <NegativeFollowUp />}
        {state.choice === "skipped" && <SkippedFollowUp onAnother={onAnother} />}
        {!state.recorded && (
          <p className="text-sm text-muted">
            {state.note ?? "El registro global no está configurado en este sitio, así que tu respuesta no se guardó."}
          </p>
        )}
      </div>
    );
  }

  const sending = state.kind === "sending";
  const disabled = !enabled || sending || state.kind === "limited";
  const icon = (c: InterestResponse) =>
    sending && state.choice === c ? <Loader2 className="size-5 animate-spin" aria-hidden /> : undefined;

  return (
    <div className="card flex flex-col items-center gap-4 p-6 text-center sm:p-8">
      <div ref={sentinel} aria-hidden className="h-px w-px" />
      <p className="font-serif text-lg text-muted">¿Terminaste de leer?</p>
      <h2 className="text-2xl font-semibold">❤️ ¿Te gustaría seguir conociendo a Jesús?</h2>
      <div className="flex w-full max-w-md flex-col gap-3">
        <Button size="lg" variant="primary" disabled={disabled} onClick={() => choose("positive")} icon={icon("positive")}>
          Sí, quiero aprender más ❤️
        </Button>
        <Button size="lg" variant="secondary" disabled={disabled} onClick={() => choose("negative")} icon={icon("negative")}>
          Por ahora no, gracias
        </Button>
        <Button size="lg" variant="secondary" disabled={disabled} onClick={() => choose("skipped")} icon={icon("skipped")}>
          Omitir
        </Button>
      </div>
      {!enabled && <p className="text-sm text-muted">Tómate un momento para leer con calma; las opciones se activarán en unos segundos.</p>}
      <p className="max-w-md text-xs text-muted">
        {api.configured
          ? "Al elegir una opción se registra, de forma anónima, que completaste esta enseñanza. No pedimos nombre, correo ni teléfono, y responder no implica ningún compromiso religioso."
          : "El registro global no está configurado en este sitio: tu respuesta no se guardará."}
      </p>
      {state.kind === "limited" && (
        <p role="alert" className="text-sm font-semibold text-rose-ink">
          Se alcanzó el límite de registros por ahora. Gracias por tu interés; intenta más tarde.
        </p>
      )}
      {state.kind === "asking" && state.error && (
        <p role="alert" className="text-sm font-semibold text-rose-ink">
          {state.error}
        </p>
      )}
    </div>
  );
}
