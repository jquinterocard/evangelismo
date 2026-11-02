/**
 * Registro global de finalizaciones y respuestas de interés en Supabase.
 * El navegador solo invoca funciones RPC validadas en la base de datos; nunca escribe tablas
 * ni contadores directamente (ver supabase/migrations).
 */
import { isUuid } from "@/lib/uuid";

export type InterestResponse = "positive" | "negative" | "skipped";

export type RpcFn = (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;

export type CompletionResult =
  | { status: "registered"; completionId: string }
  | { status: "duplicate"; completionId: string; response: InterestResponse | null }
  | { status: "rate_limited" }
  | { status: "invalid" }
  | { status: "not_configured" }
  | { status: "error"; message: string };

export type InterestResult =
  | { status: "registered"; response: InterestResponse }
  | { status: "duplicate"; response: InterestResponse }
  | { status: "invalid" }
  | { status: "not_configured" }
  | { status: "error"; message: string };

export interface DailyStat {
  day: string;
  completions: number;
  positive: number;
  negative: number;
  skipped: number;
}

export interface TopTeaching {
  teachingId: string;
  completions: number;
}

export type StatsResult<T> = { ok: true; data: T } | { ok: false; reason: "not_configured" | "error"; message?: string };

const RESPONSES: InterestResponse[] = ["positive", "negative", "skipped"];
const TEACHING_ID_RE = /^[a-z0-9-]{1,80}$/;

function firstRow(data: unknown): Record<string, unknown> | null {
  if (Array.isArray(data)) return (data[0] as Record<string, unknown>) ?? null;
  if (data && typeof data === "object") return data as Record<string, unknown>;
  return null;
}

function toInt(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : 0;
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}

function asResponse(v: unknown): InterestResponse | null {
  return RESPONSES.includes(v as InterestResponse) ? (v as InterestResponse) : null;
}

export interface CompletionsApi {
  readonly configured: boolean;
  registerCompletion(input: { teachingId: string; sessionId: string; qrId: string | null }): Promise<CompletionResult>;
  registerInterest(input: { completionId: string; sessionId: string; response: InterestResponse }): Promise<InterestResult>;
  dailyStats(input: { from: string; to: string; timeZone: string }): Promise<StatsResult<DailyStat[]>>;
  topTeachings(input: { from: string; to: string; timeZone: string; limit?: number }): Promise<StatsResult<TopTeaching[]>>;
}

export function createCompletionsApi(rpc: RpcFn | null): CompletionsApi {
  const configured = rpc !== null;

  return {
    configured,

    async registerCompletion({ teachingId, sessionId, qrId }) {
      if (!rpc) return { status: "not_configured" };
      if (!TEACHING_ID_RE.test(teachingId) || !isUuid(sessionId) || (qrId !== null && !isUuid(qrId))) {
        return { status: "invalid" };
      }
      try {
        const { data, error } = await rpc("register_completion", {
          p_teaching_id: teachingId,
          p_session_id: sessionId,
          p_qr_id: qrId,
        });
        if (error) return { status: "error", message: error.message };
        const row = firstRow(data);
        const status = row?.status;
        const id = row?.completion_id;
        if (status === "registered" && isUuid(id)) return { status: "registered", completionId: id };
        if (status === "duplicate" && isUuid(id)) {
          return { status: "duplicate", completionId: id, response: asResponse(row?.response) };
        }
        if (status === "rate_limited") return { status: "rate_limited" };
        if (status === "invalid") return { status: "invalid" };
        return { status: "error", message: "Respuesta inesperada del servidor." };
      } catch (err) {
        return { status: "error", message: err instanceof Error ? err.message : "Error de red." };
      }
    },

    async registerInterest({ completionId, sessionId, response }) {
      if (!rpc) return { status: "not_configured" };
      if (!isUuid(completionId) || !isUuid(sessionId) || !RESPONSES.includes(response)) return { status: "invalid" };
      try {
        const { data, error } = await rpc("register_interest", {
          p_completion_id: completionId,
          p_session_id: sessionId,
          p_response: response,
        });
        if (error) return { status: "error", message: error.message };
        const row = firstRow(data);
        const saved = asResponse(row?.response);
        if (row?.status === "registered" && saved) return { status: "registered", response: saved };
        if (row?.status === "duplicate" && saved) return { status: "duplicate", response: saved };
        if (row?.status === "invalid") return { status: "invalid" };
        return { status: "error", message: "Respuesta inesperada del servidor." };
      } catch (err) {
        return { status: "error", message: err instanceof Error ? err.message : "Error de red." };
      }
    },

    async dailyStats({ from, to, timeZone }) {
      if (!rpc) return { ok: false, reason: "not_configured" };
      try {
        const { data, error } = await rpc("impact_daily_stats", { p_from: from, p_to: to, p_tz: timeZone });
        if (error) return { ok: false, reason: "error", message: error.message };
        const rows = Array.isArray(data) ? data : [];
        return {
          ok: true,
          data: rows.map((r: Record<string, unknown>) => ({
            day: r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day).slice(0, 10),
            completions: toInt(r.completions),
            positive: toInt(r.positive),
            negative: toInt(r.negative),
            skipped: toInt(r.skipped),
          })),
        };
      } catch (err) {
        return { ok: false, reason: "error", message: err instanceof Error ? err.message : "Error de red." };
      }
    },

    async topTeachings({ from, to, timeZone, limit = 10 }) {
      if (!rpc) return { ok: false, reason: "not_configured" };
      try {
        const { data, error } = await rpc("top_completed_teachings", {
          p_from: from,
          p_to: to,
          p_tz: timeZone,
          p_limit: Math.max(1, Math.min(50, limit)),
        });
        if (error) return { ok: false, reason: "error", message: error.message };
        const rows = Array.isArray(data) ? data : [];
        return {
          ok: true,
          data: rows.map((r: Record<string, unknown>) => ({
            teachingId: String(r.teaching_id),
            completions: toInt(r.completions),
          })),
        };
      } catch (err) {
        return { ok: false, reason: "error", message: err instanceof Error ? err.message : "Error de red." };
      }
    },
  };
}
