"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { CloudOff, Loader2, LogOut, Mail, RefreshCw, Save, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { appConfig } from "@/lib/config";
import { whatsappChatUrl } from "@/lib/share";
import { getMentorClient, mentorAuthAvailable } from "@/lib/supabase-auth";
import { teachingRepository } from "@/features/teachings/repository";
import type { RpcFn } from "@/features/completions/api";
import {
  CONTACT_STATUS,
  createMentorApi,
  PREFERRED_LABEL,
  STATUS_LABEL,
  type ContactRequest,
  type ContactStatus,
  type MentorApi,
} from "./api";

type Auth = { kind: "loading" } | { kind: "signed-out" } | { kind: "signed-in"; session: Session };

function rpcFrom(client: SupabaseClient): RpcFn {
  return async (fn, args) => {
    const { data, error } = await client.rpc(fn, args);
    return { data, error: error ? { message: `${error.code ?? ""} ${error.message}`.trim() } : null };
  };
}

/** Panel privado de seguimiento: solo mentores invitados en Supabase Auth y registrados en `mentors`. */
export function MentorPanel() {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [auth, setAuth] = useState<Auth>({ kind: "loading" });
  const available = mentorAuthAvailable();
  const mentorApi = useMemo(() => (client ? createMentorApi(rpcFrom(client)) : null), [client]);

  useEffect(() => {
    if (!available) return;
    let unsub: (() => void) | undefined;
    let alive = true;
    getMentorClient().then(async (c) => {
      if (!alive) return;
      setClient(c);
      const { data } = await c.auth.getSession();
      if (!alive) return;
      setAuth(data.session ? { kind: "signed-in", session: data.session } : { kind: "signed-out" });
      const sub = c.auth.onAuthStateChange((_event, session) => {
        setAuth(session ? { kind: "signed-in", session } : { kind: "signed-out" });
      });
      unsub = () => sub.data.subscription.unsubscribe();
    });
    return () => {
      alive = false;
      unsub?.();
    };
  }, [available]);

  if (!available) {
    return (
      <div className="card flex items-start gap-4 p-6">
        <CloudOff className="size-8 shrink-0 text-muted" aria-hidden />
        <p className="text-muted">Este sitio no tiene configurado Supabase, así que el panel de seguimiento no está disponible.</p>
      </div>
    );
  }
  if (auth.kind === "loading" || !client) {
    return (
      <p className="flex items-center gap-2 text-muted" role="status">
        <Loader2 className="size-5 animate-spin" aria-hidden /> Cargando…
      </p>
    );
  }
  if (auth.kind === "signed-out") return <SignIn client={client} />;
  return <Requests api={mentorApi!} email={auth.session.user.email ?? ""} onSignOut={() => client.auth.signOut()} />;
}

function SignIn({ client }: { client: SupabaseClient }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setState("error");
    setState("sending");
    const { error } = await client.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}${appConfig.basePath}/seguimiento/` },
    });
    // No se revela si el correo existe: el mensaje es el mismo en ambos casos.
    setState(error && !/signups? not allowed|not found|user/i.test(error.message) ? "error" : "sent");
  }

  if (state === "sent") {
    return (
      <div className="card flex flex-col items-center gap-3 p-6 text-center">
        <Mail className="size-10 text-navy" aria-hidden />
        <p className="font-serif text-xl font-semibold text-navy-ink">Revisa tu correo</p>
        <p className="text-muted">Si tu correo está autorizado, recibirás un enlace para entrar. Ábrelo en este mismo dispositivo.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card flex max-w-md flex-col gap-4 p-6" noValidate>
      <h2 className="text-xl font-semibold">Entrar como mentor</h2>
      <p className="text-sm text-muted">Te enviaremos un enlace de acceso. Solo pueden entrar los correos que el equipo haya autorizado.</p>
      <div>
        <label htmlFor="mentor-email" className="label">
          Correo
        </label>
        <input
          id="mentor-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className="field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {state === "error" && (
        <p role="alert" className="text-sm font-semibold text-rose-ink">
          No pudimos enviar el enlace. Revisa el correo e inténtalo de nuevo.
        </p>
      )}
      <Button type="submit" disabled={state === "sending"} icon={state === "sending" ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Mail className="size-5" aria-hidden />}>
        Enviarme el enlace
      </Button>
    </form>
  );
}

export function Requests({ api, email, onSignOut }: { api: MentorApi; email: string; onSignOut: () => void }) {
  const [filter, setFilter] = useState<ContactStatus | null>("nuevo");
  const [rows, setRows] = useState<ContactRequest[] | null>(null);
  const [problem, setProblem] = useState<"unauthorized" | "error" | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let alive = true;
    api.list(filter).then((res) => {
      if (!alive) return;
      setProblem(res.ok ? null : res.reason);
      setRows(res.ok ? res.data : []);
    });
    return () => {
      alive = false;
    };
  }, [api, filter, refresh]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Sesión: <span className="font-bold text-navy-ink">{email}</span>
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setRefresh((r) => r + 1)} icon={<RefreshCw className="size-4" aria-hidden />}>
            Actualizar
          </Button>
          <Button variant="secondary" size="sm" onClick={onSignOut} icon={<LogOut className="size-4" aria-hidden />}>
            Salir
          </Button>
        </div>
      </div>

      {problem === "unauthorized" ? (
        <div className="card flex items-start gap-4 p-6" role="alert">
          <ShieldAlert className="size-8 shrink-0 text-rose-ink" aria-hidden />
          <p>Tu correo no está autorizado como mentor. Pide al administrador que lo agregue a la lista de mentores.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
            {[null, ...CONTACT_STATUS].map((s) => (
              <button
                key={s ?? "todas"}
                type="button"
                aria-pressed={filter === s}
                onClick={() => {
                  setRows(null);
                  setFilter(s);
                }}
                className={`min-h-10 rounded-full border px-4 text-sm font-bold transition ${
                  filter === s ? "border-navy bg-navy text-white" : "border-line bg-surface text-navy hover:border-navy"
                }`}
              >
                {s ? STATUS_LABEL[s] : "Todas"}
              </button>
            ))}
          </div>
          {problem === "error" && (
            <p role="alert" className="text-sm font-semibold text-rose-ink">
              No pudimos cargar las solicitudes. Revisa tu conexión e inténtalo de nuevo.
            </p>
          )}
          {rows === null ? (
            <p className="flex items-center gap-2 text-muted" role="status">
              <Loader2 className="size-5 animate-spin" aria-hidden /> Cargando solicitudes…
            </p>
          ) : rows.length === 0 ? (
            <EmptyState title="No hay solicitudes aquí" description="Cuando alguien pida que lo contacten, aparecerá en esta lista." illustration="seed" />
          ) : (
            <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {rows.map((r) => (
                <RequestCard key={r.id} request={r} api={api} onChanged={() => setRefresh((n) => n + 1)} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function RequestCard({ request: r, api, onChanged }: { request: ContactRequest; api: MentorApi; onChanged: () => void }) {
  const toast = useToast();
  const [status, setStatus] = useState<ContactStatus>(r.status);
  const [notes, setNotes] = useState(r.notes ?? "");
  const [busy, setBusy] = useState(false);
  const teaching = useMemo(() => (r.teachingId ? teachingRepository.byId(r.teachingId) : undefined), [r.teachingId]);
  const firstName = r.name.split(/\s+/)[0];
  const dirty = status !== r.status || notes !== (r.notes ?? "");

  async function save() {
    setBusy(true);
    const res = await api.update(r.id, status, notes);
    setBusy(false);
    if (res.ok && res.data === "updated") {
      toast("Cambios guardados.", "success");
      onChanged();
    } else toast("No se pudieron guardar los cambios.", "error");
  }

  async function remove() {
    if (!window.confirm(`¿Eliminar definitivamente la solicitud de ${r.name}? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    const res = await api.remove(r.id);
    setBusy(false);
    if (res.ok) {
      toast("Solicitud eliminada.", "success");
      onChanged();
    } else toast("No se pudo eliminar.", "error");
  }

  return (
    <li className="card flex min-w-0 flex-col gap-3 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold break-words">{r.name}</h3>
        <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleString("es")}</span>
      </div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
        <dt className="font-bold text-muted">Prefiere</dt>
        <dd>{PREFERRED_LABEL[r.preferredContact]}</dd>
        <dt className="font-bold text-muted">WhatsApp</dt>
        <dd className="font-mono">+{r.whatsapp}</dd>
        {r.email && (
          <>
            <dt className="font-bold text-muted">Correo</dt>
            <dd className="break-all">
              <a className="text-navy underline" href={`mailto:${r.email}`}>
                {r.email}
              </a>
            </dd>
          </>
        )}
        {teaching && (
          <>
            <dt className="font-bold text-muted">Leyó</dt>
            <dd>{teaching.title}</dd>
          </>
        )}
      </dl>
      {r.prayerRequest && (
        <blockquote className="rounded-xl bg-sky-soft p-3 text-sm whitespace-pre-line text-navy-ink">
          <span className="mb-1 block text-xs font-bold text-muted">Petición de oración</span>
          {r.prayerRequest}
        </blockquote>
      )}
      <a
        href={whatsappChatUrl(r.whatsapp, `Hola ${firstName}, te escribo de «${appConfig.name}». Gracias por dejarnos tu contacto. ¿Cómo estás?`)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#1f8f4c] px-5 font-bold text-white hover:bg-[#187a40]"
      >
        <WhatsAppIcon className="size-5" /> Abrir WhatsApp
      </a>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
        <div>
          <label htmlFor={`st-${r.id}`} className="label">
            Estado
          </label>
          <select id={`st-${r.id}`} className="field" value={status} onChange={(e) => setStatus(e.target.value as ContactStatus)}>
            {CONTACT_STATUS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`nt-${r.id}`} className="label">
            Notas del equipo
          </label>
          <textarea id={`nt-${r.id}`} className="field min-h-20 py-2" maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      {r.updatedBy && (
        <p className="text-xs text-muted">
          Última actualización: {r.updatedBy}
          {r.updatedAt ? `, ${new Date(r.updatedAt).toLocaleString("es")}` : ""}
        </p>
      )}
      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="danger" size="sm" disabled={busy} onClick={remove} icon={<Trash2 className="size-4" aria-hidden />}>
          Eliminar
        </Button>
        <Button size="sm" disabled={busy || !dirty} onClick={save} icon={<Save className="size-4" aria-hidden />}>
          Guardar
        </Button>
      </div>
    </li>
  );
}
