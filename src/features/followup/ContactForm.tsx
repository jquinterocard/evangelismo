"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { appConfig } from "@/lib/config";
import { getSessionId } from "@/features/completions/client";
import { contactFormSchema, PREFERRED_CONTACT, PREFERRED_LABEL, type FollowupApi, type PreferredContact } from "./api";
import { followupApi } from "./client";

type Field = "name" | "whatsapp" | "email" | "preferred" | "prayer" | "consent";
type State = { kind: "editing"; error?: string } | { kind: "sending" } | { kind: "done" };

/**
 * Formulario voluntario «Prefiero que me contacten». Solo se ofrece tras responder «Sí»
 * y cuando esa respuesta quedó registrada (la base de datos lo exige).
 */
export function ContactForm({
  completionId,
  api = followupApi,
  sessionId = getSessionId,
}: {
  completionId: string;
  api?: FollowupApi;
  sessionId?: () => string;
}) {
  const uid = useId();
  const [state, setState] = useState<State>({ kind: "editing" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [form, setForm] = useState({
    name: "",
    whatsapp: "",
    email: "",
    preferred: "whatsapp" as PreferredContact,
    prayer: "",
    consent: false,
    website: "", // campo trampa: las personas no lo ven
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    // Al corregir un campo, su mensaje de error desaparece.
    setErrors((prev) => (key in prev ? { ...prev, [key]: undefined } : prev));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (form.website) return setState({ kind: "done" });
    const parsed = contactFormSchema.safeParse(form);
    if (!parsed.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as Field;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setState({ kind: "sending" });
    const res = await api.submit({ completionId, sessionId: sessionId(), data: parsed.data });
    if (res.status === "registered" || res.status === "duplicate") return setState({ kind: "done" });
    if (res.status === "rate_limited") {
      return setState({ kind: "editing", error: "Recibimos muchas solicitudes en este momento. Inténtalo de nuevo en un rato." });
    }
    if (res.status === "invalid") {
      return setState({ kind: "editing", error: "No pudimos validar la solicitud. Revisa los datos o vuelve a leer la enseñanza." });
    }
    setState({ kind: "editing", error: "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo." });
  }

  if (state.kind === "done") {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-sky-soft p-5 text-center" aria-live="polite">
        <CheckCircle2 className="size-10 text-hope-ink" aria-hidden />
        <p className="font-serif text-xl font-semibold text-navy-ink">¡Gracias! Pronto te contactaremos.</p>
        <p className="text-sm text-muted">Una persona de nuestro equipo te escribirá con respeto y sin presiones.</p>
      </div>
    );
  }

  const err = (f: Field) =>
    errors[f] ? (
      <p id={`${uid}-${f}-err`} className="mt-1 text-sm font-semibold text-rose-ink">
        {errors[f]}
      </p>
    ) : null;
  const describedBy = (f: Field) => (errors[f] ? `${uid}-${f}-err` : undefined);
  const sending = state.kind === "sending";

  return (
    <form onSubmit={submit} noValidate className="flex w-full flex-col gap-4 text-left" aria-label="Solicitud de contacto">
      <div>
        <label htmlFor={`${uid}-name`} className="label">
          Tu nombre
        </label>
        <input
          id={`${uid}-name`}
          className="field"
          autoComplete="given-name"
          maxLength={80}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          aria-invalid={!!errors.name}
          aria-describedby={describedBy("name")}
        />
        {err("name")}
      </div>
      <div>
        <label htmlFor={`${uid}-wa`} className="label">
          Tu WhatsApp
        </label>
        <input
          id={`${uid}-wa`}
          className="field"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="57 300 123 4567"
          maxLength={24}
          value={form.whatsapp}
          onChange={(e) => set("whatsapp", e.target.value)}
          aria-invalid={!!errors.whatsapp}
          aria-describedby={describedBy("whatsapp") ?? `${uid}-wa-hint`}
        />
        <p id={`${uid}-wa-hint`} className="mt-1 text-xs text-muted">
          Con indicativo de país (Colombia: 57).
        </p>
        {err("whatsapp")}
      </div>
      <div>
        <label htmlFor={`${uid}-email`} className="label">
          Correo <span className="font-normal text-muted">(opcional)</span>
        </label>
        <input
          id={`${uid}-email`}
          className="field"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={120}
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          aria-invalid={!!errors.email}
          aria-describedby={describedBy("email")}
        />
        {err("email")}
      </div>
      <fieldset>
        <legend className="label">¿Cómo prefieres que te contactemos?</legend>
        <div className="flex flex-col gap-1">
          {PREFERRED_CONTACT.map((p) => (
            <label key={p} className="flex min-h-11 items-center gap-3 font-semibold">
              <input
                type="radio"
                name={`${uid}-pref`}
                className="size-5 accent-navy"
                checked={form.preferred === p}
                onChange={() => set("preferred", p)}
              />
              {PREFERRED_LABEL[p]}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor={`${uid}-prayer`} className="label">
          ¿Por qué podemos orar por ti? <span className="font-normal text-muted">(opcional)</span>
        </label>
        <textarea
          id={`${uid}-prayer`}
          className="field min-h-24 py-2"
          maxLength={1000}
          value={form.prayer}
          onChange={(e) => set("prayer", e.target.value)}
          aria-invalid={!!errors.prayer}
          aria-describedby={describedBy("prayer")}
        />
        {err("prayer")}
      </div>
      {/* Campo trampa contra bots: oculto para las personas y para lectores de pantalla. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          No llenar
          <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set("website", e.target.value)} />
        </label>
      </div>
      <div>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-5 shrink-0 accent-navy"
            checked={form.consent}
            onChange={(e) => set("consent", e.target.checked)}
            aria-invalid={!!errors.consent}
            aria-describedby={describedBy("consent")}
          />
          <span>
            Autorizo el tratamiento de mis datos personales para que el equipo de «{appConfig.name}» me contacte y me acompañe,
            según la{" "}
            <Link href="/privacidad/" className="font-bold text-navy underline" target="_blank">
              política de privacidad
            </Link>
            . Puedo pedir que los borren cuando quiera.
          </span>
        </label>
        {err("consent")}
      </div>
      {state.kind === "editing" && state.error && (
        <p role="alert" className="text-sm font-semibold text-rose-ink">
          {state.error}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={sending}
        icon={sending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Send className="size-5" aria-hidden />}
      >
        {sending ? "Enviando…" : "Enviar solicitud"}
      </Button>
    </form>
  );
}
