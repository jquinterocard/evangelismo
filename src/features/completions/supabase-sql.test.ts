// @vitest-environment node
/**
 * Prueba la migración SQL real de Supabase sobre PostgreSQL embebido (PGlite),
 * conectándola al cliente TypeScript para validar el flujo completo:
 * finalizar → preguntar → sí/no/omitir → duplicados → estadísticas.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { createCompletionsApi, type RpcFn } from "./api";

const root = process.cwd();
const migration = readFileSync(join(root, "supabase/migrations/0001_completions_and_interest.sql"), "utf8");
const seed = readFileSync(join(root, "supabase/seed_teachings.sql"), "utf8");

let db: PGlite;

/** Ejecuta una RPC como el rol anon, igual que PostgREST. */
const rpc: RpcFn = async (fn, args) => {
  const keys = Object.keys(args);
  const params = keys.map((k, i) => `${k} => $${i + 1}`).join(", ");
  try {
    await db.exec("set role anon;");
    const res = await db.query(`select * from public.${fn}(${params})`, keys.map((k) => args[k]));
    return { data: res.rows, error: null };
  } catch (e) {
    return { data: null, error: { message: (e as Error).message } };
  } finally {
    await db.exec("reset role;");
  }
};

const api = createCompletionsApi(rpc);
const S1 = "11111111-1111-4111-8111-111111111111";
const S2 = "22222222-2222-4222-8222-222222222222";
const QR = "33333333-3333-4333-8333-333333333333";
const T1 = "amor-de-dios-1-tanto-amo";
const today = new Date().toISOString().slice(0, 10);

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon nologin; create role authenticated nologin;`);
  await db.exec(migration);
  await db.exec(seed);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("migración Supabase (PGlite)", () => {
  it("el rol anon no puede leer ni escribir tablas directamente", async () => {
    await db.exec("set role anon;");
    await expect(db.query("select * from public.completion_events")).rejects.toThrow();
    await expect(
      db.query("insert into public.interest_responses (completion_id, response) values (gen_random_uuid(), 'positive')"),
    ).rejects.toThrow();
    await expect(db.query("update public.teachings set active = false")).rejects.toThrow();
    await db.exec("reset role;");
  });

  it("rechaza enseñanzas inexistentes", async () => {
    expect(await api.registerCompletion({ teachingId: "no-existe", sessionId: S1, qrId: null })).toEqual({ status: "invalid" });
  });

  it("flujo completo: finalizar, responder sí, duplicados idempotentes", async () => {
    const first = await api.registerCompletion({ teachingId: T1, sessionId: S1, qrId: QR });
    expect(first.status).toBe("registered");
    const completionId = first.status === "registered" ? first.completionId : "";

    const again = await api.registerCompletion({ teachingId: T1, sessionId: S1, qrId: QR });
    expect(again).toEqual({ status: "duplicate", completionId, response: null });

    const yes = await api.registerInterest({ completionId, sessionId: S1, response: "positive" });
    expect(yes).toEqual({ status: "registered", response: "positive" });

    // Una sola respuesta por finalización: un segundo intento devuelve la existente.
    const change = await api.registerInterest({ completionId, sessionId: S1, response: "negative" });
    expect(change).toEqual({ status: "duplicate", response: "positive" });

    const dup = await api.registerCompletion({ teachingId: T1, sessionId: S1, qrId: QR });
    expect(dup).toEqual({ status: "duplicate", completionId, response: "positive" });
  });

  it("otra sesión no puede responder por una finalización ajena", async () => {
    const r = await api.registerCompletion({ teachingId: "fe-1-certeza", sessionId: S1, qrId: null });
    expect(r.status).toBe("registered");
    const id = r.status === "registered" ? r.completionId : "";
    expect(await api.registerInterest({ completionId: id, sessionId: S2, response: "positive" })).toEqual({ status: "invalid" });
    expect(await api.registerInterest({ completionId: id, sessionId: S1, response: "skipped" })).toEqual({
      status: "registered",
      response: "skipped",
    });
  });

  it("respuesta negativa y sin QR", async () => {
    const r = await api.registerCompletion({ teachingId: "paz-1-mi-paz", sessionId: S2, qrId: null });
    const id = r.status === "registered" ? r.completionId : "";
    expect(await api.registerInterest({ completionId: id, sessionId: S2, response: "negative" })).toEqual({
      status: "registered",
      response: "negative",
    });
  });

  it("estadísticas diarias y más completadas solo cuentan eventos aceptados", async () => {
    const stats = await api.dailyStats({ from: today, to: today, timeZone: "UTC" });
    expect(stats.ok).toBe(true);
    if (stats.ok) {
      expect(stats.data).toEqual([{ day: today, completions: 3, positive: 1, negative: 1, skipped: 1 }]);
    }
    const top = await api.topTeachings({ from: today, to: today, timeZone: "UTC", limit: 5 });
    expect(top.ok && top.data.length).toBe(3);
  });

  it("limita la tasa por sesión", async () => {
    const session = "44444444-4444-4444-8444-444444444444";
    const ids = (await db.query<{ id: string }>("select id from public.teachings order by id limit 32")).rows.map((r) => r.id);
    const statuses: string[] = [];
    for (const id of ids) statuses.push((await api.registerCompletion({ teachingId: id, sessionId: session, qrId: null })).status);
    expect(statuses.filter((s) => s === "registered")).toHaveLength(30);
    expect(statuses.slice(30)).toEqual(["rate_limited", "rate_limited"]);
    const stats = await api.dailyStats({ from: today, to: today, timeZone: "UTC" });
    expect(stats.ok && stats.data[0].completions).toBe(33);
  });

  it("valida el rango de fechas de las estadísticas", async () => {
    const r = await api.dailyStats({ from: "2020-01-01", to: "2026-01-01", timeZone: "UTC" });
    expect(r.ok).toBe(false);
  });
});
