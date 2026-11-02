// Genera supabase/seed_teachings.sql a partir del catálogo (src/data/teachings/group-*.ts).
// Uso: npm run gen:sql
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "src/data/teachings");
const ids = [];
for (const f of readdirSync(dir).filter((f) => /^group-\d+\.ts$/.test(f)).sort()) {
  const src = readFileSync(join(dir, f), "utf8");
  for (const m of src.matchAll(/^\s{4}id:\s*"([a-z0-9-]{1,80})"/gm)) ids.push(m[1]);
}
if (new Set(ids).size !== ids.length) throw new Error("Hay ids de enseñanzas duplicados");
if (ids.length < 60) throw new Error(`Se esperaban al menos 60 enseñanzas, hay ${ids.length}`);

const sql = `-- Generado por scripts/gen-teachings-sql.mjs — no editar a mano.
-- Registra los ids de enseñanzas válidos para validar las finalizaciones.
insert into public.teachings (id, active) values
${ids.map((id) => `  ('${id}', true)`).join(",\n")}
on conflict (id) do update set active = excluded.active;
`;
writeFileSync(join(process.cwd(), "supabase/seed_teachings.sql"), sql);
console.log(`supabase/seed_teachings.sql: ${ids.length} enseñanzas`);
