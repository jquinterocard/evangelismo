/**
 * Seguimiento voluntario: solicitudes de contacto (visitante) y panel de mentores.
 * Igual que el registro de finalizaciones, el navegador solo invoca RPC validadas en la base
 * de datos (ver supabase/migrations/0002_contact_requests.sql).
 */
import { z } from "zod";
import { isUuid } from "@/lib/uuid";
import { firstRow, type RpcFn } from "@/features/completions/api";

export const PREFERRED_CONTACT = ["whatsapp", "llamada", "reunion"] as const;
export type PreferredContact = (typeof PREFERRED_CONTACT)[number];

export const CONTACT_STATUS = ["nuevo", "contactado", "acompanamiento", "cerrado"] as const;
export type ContactStatus = (typeof CONTACT_STATUS)[number];

export const PREFERRED_LABEL: Record<PreferredContact, string> = {
  whatsapp: "Mensaje por WhatsApp",
  llamada: "Llamada",
  reunion: "Conocernos en persona",
};

export const STATUS_LABEL: Record<ContactStatus, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  acompanamiento: "En acompañamiento",
  cerrado: "Cerrado",
};

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

/** Mismas reglas que valida la base de datos (la BD es la autoridad final). */
export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Escribe tu nombre (mínimo 2 letras).")
    .max(80, "El nombre es demasiado largo.")
    .refine((v) => !/[\u0000-\u001f\u007f]/.test(v), "El nombre tiene caracteres no válidos."),
  whatsapp: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => /^\d{8,15}$/.test(v), "Escribe tu número con indicativo de país, por ejemplo 57 300 123 4567."),
  email: z.preprocess(emptyToNull, z.string().trim().toLowerCase().max(120).email("El correo no es válido.").nullable()),
  preferred: z.enum(PREFERRED_CONTACT),
  prayer: z.preprocess(emptyToNull, z.string().trim().max(1000, "La petición puede tener hasta 1000 caracteres.").nullable()),
  consent: z.literal(true, { error: "Necesitamos tu autorización para poder contactarte." }),
});

export type ContactFormInput = z.input<typeof contactFormSchema>;
export type ContactFormData = z.output<typeof contactFormSchema>;

export type SubmitResult =
  | { status: "registered" | "duplicate" }
  | { status: "invalid" | "rate_limited" | "not_configured" }
  | { status: "error"; message: string };

export interface ContactRequest {
  id: string;
  createdAt: string;
  teachingId: string | null;
  name: string;
  whatsapp: string;
  email: string | null;
  preferredContact: PreferredContact;
  prayerRequest: string | null;
  status: ContactStatus;
  notes: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export type MentorResult<T> = { ok: true; data: T } | { ok: false; reason: "unauthorized" | "error"; message?: string };

const str = (v: unknown) => (typeof v === "string" ? v : v instanceof Date ? v.toISOString() : v == null ? null : String(v));

function isUnauthorized(message: string) {
  return /no autorizado|permission denied|42501/i.test(message);
}

/** API pública para el visitante (rol anon). */
export function createFollowupApi(rpc: RpcFn | null) {
  return {
    configured: rpc !== null,

    async submit(input: { completionId: string; sessionId: string; data: ContactFormData }): Promise<SubmitResult> {
      if (!rpc) return { status: "not_configured" };
      if (!isUuid(input.completionId) || !isUuid(input.sessionId)) return { status: "invalid" };
      const d = input.data;
      try {
        const { data, error } = await rpc("submit_contact_request", {
          p_completion_id: input.completionId,
          p_session_id: input.sessionId,
          p_name: d.name,
          p_whatsapp: d.whatsapp,
          p_email: d.email,
          p_preferred: d.preferred,
          p_prayer: d.prayer,
          p_consent: d.consent,
        });
        if (error) return { status: "error", message: error.message };
        const s = firstRow(data)?.status;
        if (s === "registered" || s === "duplicate" || s === "invalid" || s === "rate_limited") return { status: s };
        return { status: "error", message: "Respuesta inesperada del servidor." };
      } catch (err) {
        return { status: "error", message: err instanceof Error ? err.message : "Error de red." };
      }
    },
  };
}

export type FollowupApi = ReturnType<typeof createFollowupApi>;

/** API del panel de mentores (rol authenticated). */
export function createMentorApi(rpc: RpcFn) {
  async function call<T>(fn: string, args: Record<string, unknown>, map: (data: unknown) => T): Promise<MentorResult<T>> {
    try {
      const { data, error } = await rpc(fn, args);
      if (error) return { ok: false, reason: isUnauthorized(error.message) ? "unauthorized" : "error", message: error.message };
      return { ok: true, data: map(data) };
    } catch (err) {
      return { ok: false, reason: "error", message: err instanceof Error ? err.message : "Error de red." };
    }
  }

  return {
    list(status: ContactStatus | null = null) {
      return call("mentor_list_requests", { p_status: status }, (data) =>
        (Array.isArray(data) ? data : []).map(
          (r: Record<string, unknown>): ContactRequest => ({
            id: String(r.id),
            createdAt: str(r.created_at) ?? "",
            teachingId: str(r.teaching_id),
            name: String(r.name ?? ""),
            whatsapp: String(r.whatsapp ?? ""),
            email: str(r.email),
            preferredContact: (PREFERRED_CONTACT as readonly string[]).includes(String(r.preferred_contact))
              ? (r.preferred_contact as PreferredContact)
              : "whatsapp",
            prayerRequest: str(r.prayer_request),
            status: (CONTACT_STATUS as readonly string[]).includes(String(r.status)) ? (r.status as ContactStatus) : "nuevo",
            notes: str(r.notes),
            updatedAt: str(r.updated_at),
            updatedBy: str(r.updated_by),
          }),
        ),
      );
    },
    update(id: string, status: ContactStatus, notes: string) {
      return call("mentor_update_request", { p_id: id, p_status: status, p_notes: notes }, (data) => String(firstRow(data)?.status ?? ""));
    },
    remove(id: string) {
      return call("mentor_delete_request", { p_id: id }, (data) => String(firstRow(data)?.status ?? ""));
    },
  };
}

export type MentorApi = ReturnType<typeof createMentorApi>;
