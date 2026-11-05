// Verifica que el sitio exportado (out/) contiene las rutas esperadas y que los
// recursos usan la ruta base correcta. Uso: npm run verify:export
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const out = join(process.cwd(), "out");
const raw = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim();
const basePath = raw && raw !== "/" ? `/${raw.replace(/^\/+|\/+$/g, "")}` : "";
const errors = [];
const check = (cond, msg) => (cond ? null : errors.push(msg));

check(existsSync(out), "No existe out/. Ejecuta npm run build.");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const pages = [
  "index.html",
  "404.html",
  "ensenanza/index.html",
  "ensenanzas/index.html",
  "conociendo-a-jesus/index.html",
  "qr/index.html",
  "impacto/index.html",
  "metas/index.html",
  "actividades/index.html",
  "acerca/index.html",
  "privacidad/index.html",
  "manifest.webmanifest",
  "sw.js",
  ".nojekyll",
  "icons/icon-192.png",
  "icons/icon-512.png",
];
for (const p of pages) check(existsSync(join(out, p)), `Falta ${p}`);

const teachingDirs = readdirSync(join(out, "ensenanzas"), { withFileTypes: true }).filter((d) => d.isDirectory());
check(teachingDirs.length >= 60, `Se esperaban ≥60 páginas de enseñanzas, hay ${teachingDirs.length}`);
const topicDirs = readdirSync(join(out, "conociendo-a-jesus"), { withFileTypes: true }).filter((d) => d.isDirectory());
check(topicDirs.length === 10, `Se esperaban 10 temas de la ruta, hay ${topicDirs.length}`);

const index = readFileSync(join(out, "index.html"), "utf8");
check(index.includes(`${basePath}/_next/static/`), `index.html no referencia ${basePath}/_next/static/`);
if (basePath) check(!/(src|href)="\/_next\//.test(index), "Hay recursos sin la ruta base en index.html");
check(index.includes(`${basePath}/manifest.webmanifest`), "index.html no enlaza el manifest con la ruta base");

const manifest = JSON.parse(readFileSync(join(out, "manifest.webmanifest"), "utf8"));
check(manifest.start_url === `${basePath}/`, `start_url debería ser ${basePath}/ y es ${manifest.start_url}`);

// No debe haber secretos privilegiados en el bundle.
const scan = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? scan(join(dir, d.name)) : d.name.endsWith(".js") ? [join(dir, d.name)] : []));
for (const f of scan(join(out, "_next"))) {
  const src = readFileSync(f, "utf8");
  check(!/service_role/i.test(src), `Referencia a service_role en ${f}`);
}

// Narración (opcional): cada pista anunciada en el manifiesto debe existir.
let audioTracks = 0;
const audioManifest = join(out, "audio/manifest.json");
if (existsSync(audioManifest)) {
  const audio = JSON.parse(readFileSync(audioManifest, "utf8"));
  for (const [id, byVoice] of Object.entries(audio.items ?? {}))
    for (const [voice, sections] of Object.entries(byVoice))
      for (const section of Object.keys(sections)) {
        audioTracks++;
        check(existsSync(join(out, "audio", voice, id, `${section}.mp3`)), `Falta el audio ${voice}/${id}/${section}.mp3`);
      }
}

if (errors.length) {
  console.error("✗ Verificación de exportación fallida:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log(`✓ Exportación estática verificada (basePath="${basePath || "/"}", ${teachingDirs.length} enseñanzas, ${topicDirs.length} temas, ${audioTracks ? `${audioTracks} pistas de audio` : "sin narración"}).`);
