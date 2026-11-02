/** Exportación de QR: PNG (rasterizando el SVG en canvas), SVG y lotes ZIP. */
import type { QrRecord } from "@/types";
import { renderCardSvg, renderQrSvg, type QrStyle } from "./render";
import { toCsv } from "@/lib/backup";

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function svgToPngBlob(svg: string, width: number, height: number): Promise<Blob> {
  const img = new Image();
  img.decoding = "async";
  const loaded = new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("No se pudo rasterizar el SVG."));
  });
  img.src = svgToDataUrl(svg);
  await loaded;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible.");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo crear el PNG."))), "image/png"),
  );
}

export type BatchFormat = "png" | "svg" | "card";

export function fileBase(id: string): string {
  return `qr-${id.slice(0, 8)}`;
}

export async function qrPng(url: string, style: QrStyle): Promise<Blob> {
  const r = renderQrSvg(url, style);
  return svgToPngBlob(r.svg, r.pixelSize, r.pixelSize);
}

export async function cardPng(url: string, style: QrStyle): Promise<Blob> {
  return svgToPngBlob(renderCardSvg(url, style), 1200, 1800);
}

export async function buildZip(
  records: QrRecord[],
  style: QrStyle,
  formats: BatchFormat[],
  onProgress?: (done: number, total: number) => void,
): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  let done = 0;
  for (const r of records) {
    const base = fileBase(r.id);
    if (formats.includes("svg")) zip.file(`svg/${base}.svg`, renderQrSvg(r.url, style).svg);
    if (formats.includes("png")) zip.file(`png/${base}.png`, await qrPng(r.url, style));
    if (formats.includes("card")) zip.file(`tarjetas/${base}-tarjeta.png`, await cardPng(r.url, style));
    onProgress?.(++done, records.length);
  }
  zip.file(
    "manifest.csv",
    toCsv(
      ["id", "url", "creado", "plantilla"],
      records.map((r) => [r.id, r.url, r.createdAt, r.template]),
    ),
  );
  zip.file(
    "LEEME.txt",
    "Códigos QR generados con Un Encuentro con Jesús.\r\nCada código abre una enseñanza bíblica aleatoria.\r\nmanifest.csv contiene la lista de identificadores y URLs.\r\n",
  );
  return zip.generateAsync({ type: "blob" });
}
