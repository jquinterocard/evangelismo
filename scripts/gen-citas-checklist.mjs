// Genera docs/REVISION-CITAS.md: lista de todas las citas NVI para revisarlas
// contra una Biblia NVI antes de publicar. Uso: npm run gen:citas
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const str = String.raw`"((?:[^"\\]|\\.)*)"`;
const rows = [];
const dir = "src/data/teachings";
for (const f of readdirSync(dir).filter((x) => /^group-\d+\.ts$/.test(x)).sort()) {
  const src = readFileSync(join(dir, f), "utf8");
  const re = new RegExp(String.raw`id:\s*${str}[\s\S]*?reference:\s*${str},\s*verseText:\s*${str}`, "g");
  for (const m of src.matchAll(re)) rows.push({ where: `enseñanza \`${m[1]}\``, ref: m[2], text: m[3] });
}
const lp = readFileSync("src/data/learning-path.ts", "utf8");
const reLp = new RegExp(String.raw`reference:\s*${str},\s*text:\s*${str}`, "g");
for (const m of lp.matchAll(reLp)) rows.push({ where: "ruta «Conociendo a Jesús»", ref: m[1], text: m[2] });

const md = `# Revisión de citas bíblicas (NVI)

> Generado por \`npm run gen:citas\`. **Antes de publicar**, compara cada texto con una Biblia
> Nueva Versión Internacional (edición 1999/2015) y corrige en el archivo correspondiente.
> Las citas se redactaron cuidadosamente, pero pueden contener diferencias menores de puntuación o redacción.

Total: ${rows.length} citas.

| ✓ | Referencia | Dónde | Texto |
|---|---|---|---|
${rows.map((r) => `| ☐ | ${r.ref} | ${r.where} | ${r.text.replace(/\|/g, "\\|")} |`).join("\n")}
`;
writeFileSync("docs/REVISION-CITAS.md", md);
console.log(`docs/REVISION-CITAS.md: ${rows.length} citas`);
