import { describe, expect, it, vi } from "vitest";
import { createCompletionsApi, type RpcFn } from "./api";
import { isSupabaseConfigured } from "./client";

const S = "11111111-1111-4111-8111-111111111111";
const C = "22222222-2222-4222-8222-222222222222";

describe("API de finalizaciones", () => {
  it("sin Supabase configurado no registra nada", async () => {
    const api = createCompletionsApi(null);
    expect(api.configured).toBe(false);
    expect(await api.registerCompletion({ teachingId: "fe-1", sessionId: S, qrId: null })).toEqual({ status: "not_configured" });
    expect(await api.registerInterest({ completionId: C, sessionId: S, response: "positive" })).toEqual({ status: "not_configured" });
    expect((await api.dailyStats({ from: "2026-01-01", to: "2026-01-02", timeZone: "UTC" })).ok).toBe(false);
  });

  it("valida entradas antes de llamar al servidor", async () => {
    const rpc = vi.fn<RpcFn>();
    const api = createCompletionsApi(rpc);
    expect(await api.registerCompletion({ teachingId: "<x>", sessionId: S, qrId: null })).toEqual({ status: "invalid" });
    expect(await api.registerCompletion({ teachingId: "fe-1", sessionId: "x", qrId: null })).toEqual({ status: "invalid" });
    expect(await api.registerInterest({ completionId: C, sessionId: S, response: "maybe" as never })).toEqual({ status: "invalid" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("interpreta respuestas del servidor y errores de red", async () => {
    const rpc = vi
      .fn<RpcFn>()
      .mockResolvedValueOnce({ data: [{ status: "registered", completion_id: C, response: null }], error: null })
      .mockResolvedValueOnce({ data: [{ status: "rate_limited", completion_id: null }], error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "boom" } })
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ data: [{ status: "weird" }], error: null });
    const api = createCompletionsApi(rpc);
    const input = { teachingId: "fe-1", sessionId: S, qrId: null };
    expect(await api.registerCompletion(input)).toEqual({ status: "registered", completionId: C });
    expect(rpc).toHaveBeenCalledWith("register_completion", { p_teaching_id: "fe-1", p_session_id: S, p_qr_id: null });
    expect(await api.registerCompletion(input)).toEqual({ status: "rate_limited" });
    expect(await api.registerCompletion(input)).toEqual({ status: "error", message: "boom" });
    expect(await api.registerCompletion(input)).toEqual({ status: "error", message: "offline" });
    expect((await api.registerCompletion(input)).status).toBe("error");
  });

  it("detecta configuración válida", () => {
    expect(isSupabaseConfigured("", "")).toBe(false);
    expect(isSupabaseConfigured("https://abc.supabase.co", "key")).toBe(true);
    expect(isSupabaseConfigured("http://evil.com", "key")).toBe(false);
    expect(isSupabaseConfigured("no-url", "key")).toBe(false);
  });
});
