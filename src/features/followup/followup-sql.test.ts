// @vitest-environment node
/**
 * Prueba la migración 0002 (solicitudes de contacto y mentores) sobre PostgreSQL embebido (PGlite),
 * con el cliente TypeScript real: finalizar → «Sí» → pedir contacto → panel de mentores.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createCompletionsApi, type RpcFn } from "@/features/completions/api";
import { contactFormSchema, createFollowupApi, createMentorApi } from "./api";

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");

let db: PGlite;

/** Ejecuta una RPC como PostgREST: rol anon o authenticated (con el correo en el JWT). */
function rpcAs(role: "anon" | "authenticated", email?: string, ip?: string): RpcFn {
  return async (fn, args) => {
    const keys = Object.keys(args);
    const params = keys.map((k, i) => `${k} => $${i + 1}`).join(", ");
    try {
      await db.query(`select set_config('request.jwt.claims', $1, false)`, [email ? JSON.stringify({ email, role }) : ""]);
      await db.query(`select set_config('request.headers', $1, false)`, [ip ? JSON.stringify({ "x-forwarded-for": `${ip}, 10.0.0.1` }) : ""]);
      await db.exec(`set role ${role};`);
      const res = await db.query(`select * from public.${fn}(${params})`, keys.map((k) => args[k]));
      return { data: res.rows, error: null };
    } catch (e) {
      return { data: null, error: { message: (e as Error).message } };
    } finally {
      await db.exec("reset role;");
    }
  };
}

const completions = createCompletionsApi(rpcAs("anon"));
const followup = createFollowupApi(rpcAs("anon"));
const mentor = createMentorApi(rpcAs("authenticated", "Mentor@Iglesia.org"));
const stranger = createMentorApi(rpcAs("authenticated", "otro@correo.com"));

const S1 = "11111111-1111-4111-8111-111111111111";
const S2 = "22222222-2222-4222-8222-222222222222";
const T1 = "amor-de-dios-1-tanto-amo";

const valid = contactFormSchema.parse({
  name: "  Ana María ",
  whatsapp: "+57 300 123 4567",
  email: "",
  preferred: "llamada",
  prayer: "Por mi familia",
  consent: true,
});

async function positiveCompletion(session: string, response: "positive" | "negative" = "positive") {
  const c = await completions.registerCompletion({ teachingId: T1, sessionId: session, qrId: null });
  if (c.status !== "registered") throw new Error(`finalización: ${c.status}`);
  await completions.registerInterest({ completionId: c.completionId, sessionId: session, response });
  return c.completionId;
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon nologin; create role authenticated nologin;`);
  // Equivalente mínimo de auth.jwt() de Supabase.
  await db.exec(`
    create schema auth;
    create function auth.jwt() returns jsonb language sql stable as
      $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.jwt() to anon, authenticated;
  `);
  await db.exec(read("supabase/migrations/0001_completions_and_interest.sql"));
  await db.exec(read("supabase/migrations/0002_contact_requests.sql"));
  await db.exec(read("supabase/migrations/0003_contact_rate_limits.sql"));
  await db.exec(read("supabase/seed_teachings.sql"));
  await db.exec(`insert into public.mentors (email, name) values ('mentor@iglesia.org', 'Mentor')`);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("migración 0002: solicitudes de contacto", () => {
  it("anon y authenticated no pueden leer ni escribir las tablas directamente", async () => {
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role};`);
      await expect(db.query("select * from public.contact_requests")).rejects.toThrow();
      await expect(db.query("select * from public.mentors")).rejects.toThrow();
      await db.exec("reset role;");
    }
  });

  it("rechaza sin autorización, sin finalización o con otra sesión", async () => {
    const id = await positiveCompletion(S1);
    const noConsent = await rpcAs("anon")("submit_contact_request", {
      p_completion_id: id,
      p_session_id: S1,
      p_name: "Ana",
      p_whatsapp: "573001234567",
      p_email: null,
      p_preferred: "whatsapp",
      p_prayer: null,
      p_consent: false,
    });
    expect((noConsent.data as { status: string }[])[0].status).toBe("invalid");
    expect((await followup.submit({ completionId: id, sessionId: S2, data: valid })).status).toBe("invalid");
    expect((await followup.submit({ completionId: "44444444-4444-4444-8444-444444444444", sessionId: S1, data: valid })).status).toBe("invalid");
  });

  it("solo acepta a quien respondió «Sí»", async () => {
    const id = await positiveCompletion(S2, "negative");
    expect((await followup.submit({ completionId: id, sessionId: S2, data: valid })).status).toBe("invalid");
  });

  it("registra una sola solicitud por finalización y normaliza los datos", async () => {
    const session = "55555555-5555-4555-8555-555555555555";
    const id = await positiveCompletion(session);
    expect((await followup.submit({ completionId: id, sessionId: session, data: valid })).status).toBe("registered");
    expect((await followup.submit({ completionId: id, sessionId: session, data: valid })).status).toBe("duplicate");
    const rows = await db.query<{ name: string; whatsapp: string; email: string | null; teaching_id: string; status: string }>(
      "select name, whatsapp, email, teaching_id, status from public.contact_requests",
    );
    expect(rows.rows).toEqual([{ name: "Ana María", whatsapp: "573001234567", email: null, teaching_id: T1, status: "nuevo" }]);
  });

  it("un usuario autenticado que no es mentor no ve nada", async () => {
    const res = await stranger.list();
    expect(res).toMatchObject({ ok: false, reason: "unauthorized" });
    const anon = createMentorApi(rpcAs("anon"));
    expect((await anon.list()).ok).toBe(false);
  });

  it("un mentor lista, actualiza y elimina solicitudes", async () => {
    const list = await mentor.list();
    if (!list.ok) throw new Error(list.message);
    expect(list.data).toHaveLength(1);
    const r = list.data[0];
    expect(r).toMatchObject({ name: "Ana María", preferredContact: "llamada", prayerRequest: "Por mi familia", status: "nuevo" });

    const upd = await mentor.update(r.id, "contactado", "Le escribí el lunes");
    expect(upd).toEqual({ ok: true, data: "updated" });
    const filtered = await mentor.list("contactado");
    expect(filtered.ok && filtered.data[0]).toMatchObject({ notes: "Le escribí el lunes", updatedBy: "mentor@iglesia.org" });
    expect(await mentor.update(r.id, "inventado" as never, "")).toEqual({ ok: true, data: "invalid" });

    expect(await mentor.remove(r.id)).toEqual({ ok: true, data: "deleted" });
    const after = await mentor.list();
    expect(after.ok && after.data).toEqual([]);
  });

  it("no se puede agotar el cupo cambiando de sesión: límite por conexión y por número", async () => {
    let n = 0;
    const session = () => `66666666-6666-4666-8666-${String(++n).padStart(12, "0")}`;
    const fromIp = createFollowupApi(rpcAs("anon", undefined, "203.0.113.7"));
    const withPhone = (phone: string) => ({ ...valid, whatsapp: phone });

    // Mismo número en 24 h: se trata como duplicado, sin crear otra fila.
    const s1 = session();
    expect((await fromIp.submit({ completionId: await positiveCompletion(s1), sessionId: s1, data: withPhone("573110000001") })).status).toBe("registered");
    const s2 = session();
    expect((await fromIp.submit({ completionId: await positiveCompletion(s2), sessionId: s2, data: withPhone("573110000001") })).status).toBe("duplicate");

    // Misma conexión: máximo 3 por hora aunque cambien la sesión y el número.
    const results: string[] = [];
    for (const phone of ["573110000002", "573110000003", "573110000004"]) {
      const s = session();
      results.push((await fromIp.submit({ completionId: await positiveCompletion(s), sessionId: s, data: withPhone(phone) })).status);
    }
    expect(results).toEqual(["registered", "registered", "rate_limited"]);

    // Otra conexión no queda bloqueada.
    const other = createFollowupApi(rpcAs("anon", undefined, "198.51.100.9"));
    const s3 = session();
    expect((await other.submit({ completionId: await positiveCompletion(s3), sessionId: s3, data: withPhone("573110000005") })).status).toBe("registered");

    // Solo se guarda un hash de la conexión, nunca la IP.
    const keys = await db.query<{ client_key: string | null }>("select client_key from public.contact_requests");
    expect(keys.rows.every((r) => r.client_key === null || /^[0-9a-f]{32}$/.test(r.client_key))).toBe(true);
    const raw = await db.query("select 1 from public.contact_requests where client_key like '%203.0.113.7%'");
    expect(raw.rows).toHaveLength(0);
  });
});
