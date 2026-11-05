// Genera la narración de enseñanzas y temas con Piper TTS (open source) en public/audio/.
// Requisitos: Python 3 con `pip install piper-tts` (por defecto en .venv-tts/) y ffmpeg.
// Uso: npm run gen:audio [-- --only <id> --voice f|m --force]
//   PIPER_PYTHON  intérprete de Python con piper-tts (por defecto .venv-tts/bin/python)
//   PIPER_VOICES  carpeta donde se guardan las voces (por defecto ~/.cache/piper-voices)
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir, cpus } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const outDir = join(root, "public/audio");
const voicesDir = process.env.PIPER_VOICES || join(homedir(), ".cache/piper-voices");
const python = process.env.PIPER_PYTHON || join(root, ".venv-tts/bin/python");

/** Voces de rhasspy/piper-voices (licencias en el MODEL_CARD de cada voz). */
const VOICES = {
  f: {
    label: "Femenina",
    name: "es_MX-claude-high",
    path: "es/es_MX/claude/high",
    sha256: "3ef40a71ea63852cd8ab7e6fa7d2ecdcfa67a0b47c9c48e3f10e02ee02083ea0",
    lengthScale: 1.05,
  },
  m: {
    label: "Masculina",
    name: "es_MX-ald-medium",
    path: "es/es_MX/ald/medium",
    sha256: "019b3803293c93e34a206dd2e53a3889209a514e786fd7144f7b70196c579b63",
    lengthScale: 1.0,
  },
};
const VOICES_REV = "v1.0.0";
const SENTENCE_SILENCE = 0.35;
const BITRATE = "40k";
/** Cambia si cambian los parámetros de síntesis/codificación, para regenerar todo. */
const PARAMS = `${VOICES_REV}|${SENTENCE_SILENCE}|${BITRATE}|pad1`;

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const only = opt("only");
const onlyVoice = opt("voice");
const force = args.includes("--force");

// ── Contenido ────────────────────────────────────────────────────────────────
const load = (p) => import(pathToFileURL(join(root, p)).href);
const { teachingSections, topicSections, topicAudioId } = await load("src/features/audio/speech-text.ts");
const teachings = [];
for (const f of readdirSync(join(root, "src/data/teachings")).filter((f) => /^group-\d+\.ts$/.test(f)).sort()) {
  const mod = await load(`src/data/teachings/${f}`);
  for (const v of Object.values(mod)) if (Array.isArray(v)) teachings.push(...v);
}
const { learningPath } = await load("src/data/learning-path.ts");

/** id → secciones [{key, text}] */
const items = new Map();
for (const t of teachings) if (t.active) items.set(t.id, teachingSections(t));
for (const topic of learningPath) items.set(topicAudioId(topic.slug), topicSections(topic));
if (only && !items.has(only)) throw new Error(`No existe la enseñanza o tema «${only}»`);

// ── Voces ───────────────────────────────────────────────────────────────────
const sha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
async function ensureVoice(v) {
  mkdirSync(voicesDir, { recursive: true });
  const model = join(voicesDir, `${v.name}.onnx`);
  const config = `${model}.json`;
  const base = `https://huggingface.co/rhasspy/piper-voices/resolve/${VOICES_REV}/${v.path}/${v.name}`;
  for (const [file, url] of [[model, `${base}.onnx`], [config, `${base}.onnx.json`]]) {
    if (existsSync(file)) continue;
    console.log(`Descargando ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`No se pudo descargar ${url}: ${res.status}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  if (sha256(model) !== v.sha256) throw new Error(`La voz ${v.name} no coincide con el SHA-256 esperado; bórrala de ${voicesDir}`);
  // Algunas voces antiguas guardan el tipo de fonema con un formato que piper-tts ≥1.3 no acepta.
  const json = readFileSync(config, "utf8");
  if (json.includes('"PhonemeType.ESPEAK"')) writeFileSync(config, json.replace('"PhonemeType.ESPEAK"', '"espeak"'));
  return model;
}

// ── Síntesis ────────────────────────────────────────────────────────────────
function startPiper(model, lengthScale) {
  const proc = spawn(python, [join(root, "scripts/piper_batch.py"), model, String(lengthScale), String(SENTENCE_SILENCE)], {
    stdio: ["pipe", "pipe", "inherit"],
  });
  const waiting = [];
  createInterface({ input: proc.stdout }).on("line", (line) => {
    if (line.startsWith("ok ")) waiting.shift()?.resolve();
  });
  proc.on("exit", (code) => {
    for (const w of waiting.splice(0)) w.reject(new Error(`piper terminó con código ${code}`));
  });
  return {
    synth: (text, out) =>
      new Promise((resolve, reject) => {
        waiting.push({ resolve, reject });
        proc.stdin.write(`${JSON.stringify({ text, out })}\n`);
      }),
    close: () => new Promise((r) => (proc.stdin.end(), proc.on("close", r))),
  };
}

const run = (cmd, argv) =>
  new Promise((resolve, reject) => {
    const p = spawn(cmd, argv, { stdio: ["ignore", "ignore", "inherit"] });
    p.on("error", reject);
    p.on("exit", (c) => (c === 0 ? resolve() : reject(new Error(`${cmd} terminó con código ${c}`))));
  });
const toMp3 = (wav, mp3) =>
  run("ffmpeg", ["-loglevel", "error", "-y", "-i", wav, "-af", "adelay=150,apad=pad_dur=0.5", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", BITRATE, mp3]);
const duration = (file) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());

// ── Principal ────────────────────────────────────────────────────────────────
const manifestPath = join(outDir, "manifest.json");
const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : { items: {} };
const manifest = {
  version: 1,
  voices: Object.fromEntries(Object.entries(VOICES).map(([k, v]) => [k, { label: v.label, name: v.name }])),
  items: {},
};
const work = join(tmpdir(), `gen-audio-${process.pid}`);
mkdirSync(work, { recursive: true });
let made = 0;
let kept = 0;

try {
  for (const [vk, v] of Object.entries(VOICES)) {
    const model = await ensureVoice(v);
    const todo = [];
    for (const [id, sections] of items) {
      for (const s of sections) {
        const hash = createHash("sha256").update(`${PARAMS}|${v.name}|${v.lengthScale}|${s.text}`).digest("hex").slice(0, 10);
        const file = join(outDir, vk, id, `${s.key}.mp3`);
        const prev = previous.items[id]?.[vk]?.[s.key];
        const entry = { d: prev?.d ?? 0, h: hash };
        ((manifest.items[id] ??= {})[vk] ??= {})[s.key] = entry;
        const selected = (!only || only === id) && (!onlyVoice || onlyVoice === vk);
        if (prev?.h === hash && existsSync(file) && !force) kept++;
        else if (selected) todo.push({ id, s, file, entry });
        else delete manifest.items[id][vk][s.key]; // sin audio vigente: no se anuncia
      }
    }
    if (!todo.length) continue;
    console.log(`Voz ${v.label} (${v.name}): ${todo.length} pistas por generar`);
    const piper = startPiper(model, v.lengthScale);
    const pending = [];
    const limit = Math.max(1, cpus().length - 1);
    for (const [n, job] of todo.entries()) {
      const wav = join(work, `${vk}-${n}.wav`);
      await piper.synth(job.s.text, wav);
      mkdirSync(join(outDir, vk, job.id), { recursive: true });
      pending.push(
        toMp3(wav, job.file).then(() => {
          job.entry.d = Math.round(duration(job.file) * 10) / 10;
          rmSync(wav);
          made++;
          process.stdout.write(`\r  ${made} generadas`);
        }),
      );
      if (pending.length >= limit) await Promise.all(pending.splice(0));
    }
    await Promise.all(pending);
    await piper.close();
    process.stdout.write("\n");
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

// Quita del manifiesto ítems o voces vacíos y borra carpetas de contenido que ya no existe.
for (const [id, byVoice] of Object.entries(manifest.items)) {
  for (const [vk, secs] of Object.entries(byVoice)) if (!Object.keys(secs).length) delete byVoice[vk];
  if (!Object.keys(byVoice).length) delete manifest.items[id];
}
for (const vk of Object.keys(VOICES)) {
  const dir = join(outDir, vk);
  if (!existsSync(dir)) continue;
  for (const d of readdirSync(dir)) if (!items.has(d)) rmSync(join(dir, d), { recursive: true, force: true });
}
mkdirSync(outDir, { recursive: true });
writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`);
console.log(`public/audio: ${made} generadas, ${kept} sin cambios, ${Object.keys(manifest.items).length} ítems en el manifiesto`);
