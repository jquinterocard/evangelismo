"use client";

import { useId, useMemo, useState } from "react";
import { AlertTriangle, Copy, Download, FileArchive, IdCard, Loader2, QrCode, RefreshCw, Share2, Trash2 } from "lucide-react";
import type { Preferences, QrRecord, QrTemplateId } from "@/types";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore, useHydrated } from "@/hooks/useStore";
import { usePublicBase } from "@/hooks/usePublicBase";
import { preferencesStore, qrHistoryStore } from "@/lib/stores";
import { downloadBlob } from "@/lib/backup";
import { copyText, shareOrCopy } from "@/lib/share";
import { isHexColor } from "@/lib/sanitize";
import { appConfig } from "@/lib/config";
import { legibilityWarnings, QR_TEMPLATES, renderQrSvg, type QrStyle } from "./render";
import { buildZip, cardPng, fileBase, qrPng, svgToDataUrl, type BatchFormat } from "./export";
import { createQrRecords, saveQrRecords } from "./history";

const SIZES = [256, 512, 1024, 2048];

function styleFrom(p: Preferences): QrStyle {
  return { color: p.qrColor, background: p.qrBackground, size: p.qrSize, margin: p.qrMargin, template: p.qrTemplate };
}

export function QrGenerator() {
  const prefs = useStore(preferencesStore);
  const history = useStore(qrHistoryStore);
  const hydrated = useHydrated();
  const base = usePublicBase();
  const toast = useToast();
  const uid = useId();

  const [current, setCurrent] = useState<QrRecord | null>(null);
  const [batchCount, setBatchCount] = useState(10);
  const [formats, setFormats] = useState<BatchFormat[]>(["png", "card"]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const style = styleFrom(prefs);
  const warnings = legibilityWarnings(style.color, style.background);
  const preview = useMemo(() => (current ? renderQrSvg(current.url, { ...style, size: 512 }).svg : null), [current, style.color, style.background, style.margin, style.template]); // eslint-disable-line react-hooks/exhaustive-deps

  function setPref<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    const res = preferencesStore.update((p) => ({ ...p, [key]: value }));
    if (!res.ok) toast(res.message, "error");
  }

  function generateOne() {
    if (!base) return;
    // Se guarda en el historial al descargarlo, copiarlo o compartirlo.
    const [rec] = createQrRecords(base, 1, style.template);
    setCurrent(rec);
  }

  // Genera el primer QR tras hidratar (estado propio ajustado durante el render).
  if (hydrated && base && current === null) {
    const [rec] = createQrRecords(base, 1, style.template);
    setCurrent(rec);
  }

  async function run(task: () => Promise<void>) {
    setBusy(true);
    try {
      await task();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ocurrió un error.", "error");
    } finally {
      setBusy(false);
    }
  }

  function remember(rec: QrRecord) {
    if (!history.some((h) => h.id === rec.id)) saveQrRecords([rec]);
  }

  const downloadPng = () =>
    current &&
    run(async () => {
      downloadBlob(await qrPng(current.url, style), `${fileBase(current.id)}.png`);
      remember(current);
    });
  const downloadCardPng = () =>
    current &&
    run(async () => {
      downloadBlob(await cardPng(current.url, style), `${fileBase(current.id)}-tarjeta.png`);
      remember(current);
    });

  async function copyUrl() {
    if (!current) return;
    const ok = await copyText(current.url);
    if (ok) remember(current);
    toast(ok ? "URL copiada." : "No se pudo copiar.", ok ? "success" : "error");
  }

  async function share() {
    if (!current) return;
    const outcome = await shareOrCopy({ title: appConfig.name, text: appConfig.scanInstruction, url: current.url });
    if (outcome === "shared" || outcome === "copied") remember(current);
    if (outcome === "copied") toast("Enlace copiado para compartir.");
    if (outcome === "failed") toast("No se pudo compartir.", "error");
  }

  function downloadBatch() {
    if (!base || formats.length === 0) return;
    const records = createQrRecords(base, batchCount, style.template);
    run(async () => {
      setProgress({ done: 0, total: records.length });
      const blob = await buildZip(records, style, formats, (done, total) => setProgress({ done, total }));
      downloadBlob(blob, `codigos-qr-${records.length}-${new Date().toISOString().slice(0, 10)}.zip`);
      const res = saveQrRecords(records);
      if (!res.ok) toast(res.message, "error");
      else toast(`${records.length} códigos generados y guardados en el historial.`);
      setProgress(null);
    });
  }

  function toggleFormat(f: BatchFormat) {
    setFormats((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      {/* Vista previa */}
      <section className="card flex flex-col items-center gap-4 p-5 sm:p-6 lg:sticky lg:top-20 lg:self-start" aria-labelledby={`${uid}-prev`}>
        <h2 id={`${uid}-prev`} className="self-start text-xl font-semibold">
          Vista previa
        </h2>
        <div className="w-full max-w-[22rem] rounded-2xl border border-line bg-[#fff] p-3">
          {preview ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={svgToDataUrl(preview)} alt={`Código QR que abre ${current?.url}`} className="aspect-square w-full" />
          ) : (
            <div className="grid aspect-square w-full place-items-center text-muted">
              <QrCode className="size-16" aria-hidden />
            </div>
          )}
        </div>
        {warnings.length > 0 && (
          <ul className="w-full rounded-xl bg-gold-soft p-3 text-sm text-gold-ink" role="alert">
            {warnings.map((w) => (
              <li key={w} className="flex gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {w}
              </li>
            ))}
          </ul>
        )}
        <div className="grid w-full grid-cols-2 gap-2">
          <Button onClick={generateOne} variant="gold" className="col-span-2" icon={<RefreshCw className="size-4" aria-hidden />}>
            Generar nuevo QR
          </Button>
          <Button onClick={downloadPng} disabled={!current || busy} icon={<Download className="size-4" aria-hidden />}>
            PNG
          </Button>
          <Button onClick={downloadCardPng} variant="secondary" disabled={!current || busy} icon={<IdCard className="size-4" aria-hidden />}>
            Tarjeta PNG
          </Button>
          <Button onClick={copyUrl} variant="ghost" disabled={!current} icon={<Copy className="size-4" aria-hidden />}>
            Copiar URL
          </Button>
          <Button onClick={share} variant="ghost" disabled={!current} icon={<Share2 className="size-4" aria-hidden />}>
            Compartir
          </Button>
        </div>
        <p className="text-center text-xs text-muted">
          Cada código tiene un identificador aleatorio y muestra una enseñanza distinta en cada visita.
        </p>
      </section>

      <div className="flex flex-col gap-6">
        {/* Personalización */}
        <section className="card p-5 sm:p-6" aria-labelledby={`${uid}-style`}>
          <h2 id={`${uid}-style`} className="text-xl font-semibold">
            Personalización
          </h2>
          <fieldset className="mt-4">
            <legend className="label">Plantilla decorativa</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {QR_TEMPLATES.map((t) => (
                <label
                  key={t.id}
                  className={`flex min-h-14 cursor-pointer flex-col justify-center rounded-xl border px-3 py-2 text-sm transition has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-gold ${
                    prefs.qrTemplate === t.id ? "border-navy bg-sky-soft" : "border-line bg-surface hover:border-navy/40"
                  }`}
                >
                  <input
                    type="radio"
                    name={`${uid}-tpl`}
                    value={t.id}
                    checked={prefs.qrTemplate === t.id}
                    onChange={() => setPref("qrTemplate", t.id as QrTemplateId)}
                    className="sr-only"
                  />
                  <span className="font-bold text-navy-ink">{t.name}</span>
                  <span className="text-xs text-muted">{t.description}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${uid}-c`} className="label">
                Color principal
              </label>
              <input
                id={`${uid}-c`}
                type="color"
                className="field h-12 cursor-pointer p-1"
                value={prefs.qrColor}
                onChange={(e) => isHexColor(e.target.value) && setPref("qrColor", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor={`${uid}-b`} className="label">
                Fondo
              </label>
              <input
                id={`${uid}-b`}
                type="color"
                className="field h-12 cursor-pointer p-1"
                value={prefs.qrBackground}
                onChange={(e) => isHexColor(e.target.value) && setPref("qrBackground", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor={`${uid}-s`} className="label">
                Tamaño (PNG)
              </label>
              <select id={`${uid}-s`} className="field" value={prefs.qrSize} onChange={(e) => setPref("qrSize", Number(e.target.value))}>
                {SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s} × {s} px
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${uid}-m`} className="label">
                Margen: {prefs.qrMargin} módulos
              </label>
              <input
                id={`${uid}-m`}
                type="range"
                min={0}
                max={8}
                className="h-12 w-full accent-navy"
                value={prefs.qrMargin}
                onChange={(e) => setPref("qrMargin", Number(e.target.value))}
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">
            Con símbolo central se usa corrección de errores alta (H) y el emblema ocupa como máximo el 20 % del código. Se recomienda
            un margen de al menos 2 módulos.
          </p>
        </section>

        {/* Lote */}
        <section className="card p-5 sm:p-6" aria-labelledby={`${uid}-batch`}>
          <h2 id={`${uid}-batch`} className="flex items-center gap-2 text-xl font-semibold">
            <FileArchive className="size-5 text-gold-ink" aria-hidden /> Generar varios códigos
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${uid}-n`} className="label">
                Cantidad (1–100)
              </label>
              <input
                id={`${uid}-n`}
                type="number"
                min={1}
                max={100}
                inputMode="numeric"
                className="field"
                value={batchCount}
                onChange={(e) => setBatchCount(Math.max(1, Math.min(100, Math.floor(Number(e.target.value) || 1))))}
              />
            </div>
            <fieldset>
              <legend className="label">Formatos</legend>
              <div className="flex flex-wrap gap-3">
                {(
                  [
                    ["png", "PNG"],
                    ["card", "Tarjetas"],
                  ] as const
                ).map(([f, label]) => (
                  <label key={f} className="flex min-h-11 items-center gap-2 font-semibold">
                    <input type="checkbox" className="size-5 accent-navy" checked={formats.includes(f)} onChange={() => toggleFormat(f)} />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <Button
            className="mt-4 w-full"
            size="lg"
            onClick={downloadBatch}
            disabled={busy || formats.length === 0 || !base}
            icon={busy && progress ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <FileArchive className="size-5" aria-hidden />}
          >
            {progress ? `Generando ${progress.done}/${progress.total}…` : "Descargar lote ZIP"}
          </Button>
          <p className="mt-2 text-xs text-muted">El ZIP incluye manifest.csv con los identificadores y URLs.</p>
        </section>

        {/* Historial */}
        <section className="card p-5 sm:p-6" aria-labelledby={`${uid}-hist`}>
          <div className="flex items-center justify-between gap-2">
            <h2 id={`${uid}-hist`} className="text-xl font-semibold">
              Historial local
            </h2>
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (window.confirm("¿Borrar el historial de códigos generados en este navegador?")) qrHistoryStore.clear();
                }}
                icon={<Trash2 className="size-4" aria-hidden />}
              >
                Borrar
              </Button>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            {history.length} código(s) generados y guardados solo en este navegador.
          </p>
          {history.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="Aún no hay códigos guardados" description="Descarga un código o un lote y aparecerá aquí." illustration="seed" />
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {history.slice(0, 15).map((h) => (
                <li key={h.id} className="flex items-center gap-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-xs text-navy-ink">{h.url}</span>
                    <span className="text-xs text-muted">{new Date(h.createdAt).toLocaleString("es")}</span>
                  </span>
                  <button
                    type="button"
                    className="grid size-11 shrink-0 place-items-center rounded-full text-navy hover:bg-sky-soft"
                    aria-label="Ver este código"
                    onClick={() => setCurrent(h)}
                  >
                    <QrCode className="size-5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
