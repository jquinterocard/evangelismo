// Simulador local de Supabase para desarrollo y pruebas de punta a punta.
// Ejecuta la migración real sobre PostgreSQL embebido (PGlite) y expone solo
// los endpoints RPC de PostgREST (/rest/v1/rpc/<función>) con el rol anon.
// Uso:
//   npm run supabase:local            (puerto 54321)
//   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=local npm run dev
// Los datos viven en memoria y se pierden al detenerlo. NO es para producción.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const port = Number(process.env.SUPABASE_LOCAL_PORT) || 54321;
const db = new PGlite();
await db.exec("create role anon nologin; create role authenticated nologin;");
await db.exec(readFileSync("supabase/migrations/0001_completions_and_interest.sql", "utf8"));
await db.exec(readFileSync("supabase/seed_teachings.sql", "utf8"));
const allowed = new Set(["register_completion", "register_interest", "impact_daily_stats", "top_completed_teachings"]);
let queue = Promise.resolve();

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

createServer((req, res) => {
  if (req.method === "OPTIONS") return res.writeHead(204, cors).end();
  const m = /^\/rest\/v1\/rpc\/([a-z_]+)$/.exec(new URL(req.url, "http://x").pathname);
  if (req.method !== "POST" || !m || !allowed.has(m[1])) {
    res.writeHead(404, { ...cors, "Content-Type": "application/json" });
    return res.end(JSON.stringify({ message: "No encontrado" }));
  }
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    queue = queue.then(async () => {
      try {
        const args = body ? JSON.parse(body) : {};
        const keys = Object.keys(args).filter((k) => /^p_[a-z_]+$/.test(k));
        const sql = `select * from public.${m[1]}(${keys.map((k, i) => `${k} => $${i + 1}`).join(", ")})`;
        await db.exec("set role anon;");
        const r = await db.query(sql, keys.map((k) => args[k]));
        await db.exec("reset role;");
        const rows = r.rows.map((row) =>
          Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v instanceof Date ? v.toISOString().slice(0, 10) : typeof v === "bigint" ? Number(v) : v])),
        );
        res.writeHead(200, { ...cors, "Content-Type": "application/json" });
        res.end(JSON.stringify(rows));
      } catch (e) {
        await db.exec("reset role;").catch(() => {});
        res.writeHead(400, { ...cors, "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: e.message }));
      }
    });
  });
}).listen(port, () => console.log(`Supabase local (PGlite) en http://localhost:${port}`));
