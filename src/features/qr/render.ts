/**
 * Renderizado de códigos QR a SVG (puro, sin DOM) con plantillas decorativas.
 * El PNG se obtiene rasterizando este mismo SVG, así ambos formatos son idénticos.
 */
import QRCode from "qrcode";
import type { QrTemplateId } from "@/types";
import { appConfig } from "@/lib/config";

export interface QrStyle {
  color: string;
  background: string;
  /** Tamaño en píxeles del lado del QR. */
  size: number;
  /** Margen en módulos (zona silenciosa). */
  margin: number;
  template: QrTemplateId;
}

export const QR_TEMPLATES: { id: QrTemplateId; name: string; description: string }[] = [
  { id: "cross", name: "Cruz", description: "Una cruz dorada al centro." },
  { id: "heart", name: "Corazón", description: "El amor de Dios en el centro." },
  { id: "dove", name: "Paloma", description: "Símbolo del Espíritu Santo." },
  { id: "bible", name: "Biblia abierta", description: "La Palabra de Dios." },
  { id: "minimal", name: "Minimalista", description: "Solo el código, máxima sencillez." },
];

/** Fracción máxima del lado ocupada por el emblema (corrección H tolera ~30 % de daño). */
export const EMBLEM_FRACTION = 0.2;

const HEX = /^#[0-9a-f]{6}$/i;

export function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);
}

function safeColor(c: string, fallback: string): string {
  return HEX.test(c) ? c : fallback;
}

export function errorCorrectionFor(template: QrTemplateId): "M" | "H" {
  return template === "minimal" ? "M" : "H";
}

export interface QrMatrix {
  size: number;
  isDark(x: number, y: number): boolean;
}

export function createMatrix(text: string, template: QrTemplateId): QrMatrix {
  const qr = QRCode.create(text, { errorCorrectionLevel: errorCorrectionFor(template) });
  const size = qr.modules.size;
  return { size, isDark: (x, y) => qr.modules.get(y, x) === 1 };
}

/** Luminancia relativa WCAG. */
function luminance(hex: string): number {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = v.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Advertencias de legibilidad del QR según colores elegidos. */
export function legibilityWarnings(color: string, background: string): string[] {
  const out: string[] = [];
  if (!HEX.test(color) || !HEX.test(background)) return ["Colores inválidos."];
  const ratio = contrastRatio(color, background);
  if (ratio < 4) out.push(`El contraste es bajo (${ratio.toFixed(1)}:1). Algunos lectores no podrán escanearlo; usa colores más diferenciados.`);
  if (luminance(color) > luminance(background)) {
    out.push("El código es más claro que el fondo (invertido). Muchas cámaras no leen QR invertidos.");
  }
  return out;
}

/** Trazos de cada emblema en un lienzo de 100×100. */
function emblemMarkup(template: QrTemplateId, color: string): string {
  const gold = appConfig.colors.gold;
  switch (template) {
    case "cross":
      return `<rect x="42" y="12" width="16" height="76" rx="3" fill="${gold}"/><rect x="20" y="30" width="60" height="15" rx="3" fill="${gold}"/>`;
    case "heart":
      return `<path d="M50 86C22 66 10 52 10 36c0-12 9-21 21-21 8 0 15 4 19 11 4-7 11-11 19-11 12 0 21 9 21 21 0 16-12 30-40 50z" fill="#D9707E"/><rect x="46" y="30" width="8" height="34" rx="2" fill="#fff"/><rect x="37" y="39" width="26" height="7" rx="2" fill="#fff"/>`;
    case "dove":
      return `<path d="M14 58c14-8 34-10 52-6 8 2 15 0 20-6 5-4 11-2 13 2-4 0-6 1-8 4 0 12-10 22-26 24-8 1-14 5-19 12-1-7 1-12 5-16-17 2-30-3-37-14z" fill="#fff" stroke="${color}" stroke-width="3" stroke-linejoin="round"/><path d="M48 54C40 36 28 24 10 18c10 12 14 24 16 36 8 3 14 3 22 0z" fill="#fff" stroke="${color}" stroke-width="3" stroke-linejoin="round"/><path d="M52 54c3-18 13-32 32-40-3 13-3 25 0 34-9 6-20 8-32 6z" fill="#fff" stroke="${color}" stroke-width="3" stroke-linejoin="round"/><circle cx="84" cy="52" r="2.5" fill="${color}"/>`;
    case "bible":
      return `<path d="M8 30c14-6 28-6 42 2v52c-14-8-28-8-42-2z" fill="#fff" stroke="${color}" stroke-width="3.5" stroke-linejoin="round"/><path d="M92 30c-14-6-28-6-42 2v52c14-8 28-8 42-2z" fill="#fff" stroke="${color}" stroke-width="3.5" stroke-linejoin="round"/><rect x="63" y="44" width="5" height="22" rx="1" fill="${gold}"/><rect x="57" y="50" width="17" height="5" rx="1" fill="${gold}"/>`;
    default:
      return "";
  }
}

export interface RenderedQr {
  svg: string;
  /** Tamaño en píxeles del SVG resultante. */
  pixelSize: number;
  modules: number;
  emblemModules: number;
}

/** Genera el SVG del QR (con emblema según plantilla). */
export function renderQrSvg(text: string, style: QrStyle): RenderedQr {
  const color = safeColor(style.color, "#25476A");
  const bg = safeColor(style.background, "#FFFFFF");
  const margin = Math.max(0, Math.min(16, Math.round(style.margin)));
  const matrix = createMatrix(text, style.template);
  const n = matrix.size;
  const total = n + margin * 2;
  const pixelSize = Math.max(64, Math.min(4096, Math.round(style.size)));

  // Área central reservada para el emblema (en módulos, impar para quedar centrada).
  let emblemModules = 0;
  if (style.template !== "minimal") {
    emblemModules = Math.floor(n * EMBLEM_FRACTION);
    if (emblemModules % 2 === 0) emblemModules -= 1;
  }
  const eStart = Math.floor((n - emblemModules) / 2);
  const eEnd = eStart + emblemModules;
  const inEmblem = (x: number, y: number) => emblemModules > 0 && x >= eStart && x < eEnd && y >= eStart && y < eEnd;

  let path = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (matrix.isDark(x, y) && !inEmblem(x, y)) path += `M${x + margin} ${y + margin}h1v1h-1z`;
    }
  }

  let emblem = "";
  if (emblemModules > 0) {
    const pad = 0.6;
    const ex = eStart + margin - pad;
    const size = emblemModules + pad * 2;
    const inner = emblemModules * 0.82;
    const offset = eStart + margin + (emblemModules - inner) / 2;
    emblem =
      `<rect x="${ex}" y="${ex}" width="${size}" height="${size}" rx="${size * 0.22}" fill="${bg}"/>` +
      `<g transform="translate(${offset} ${offset}) scale(${inner / 100})">${emblemMarkup(style.template, color)}</g>`;
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelSize}" height="${pixelSize}" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">` +
    `<rect width="${total}" height="${total}" fill="${bg}"/>` +
    `<path d="${path}" fill="${color}"/>` +
    (emblem ? `<g shape-rendering="geometricPrecision">${emblem}</g>` : "") +
    `</svg>`;

  return { svg, pixelSize, modules: n, emblemModules };
}

/** Tarjeta imprimible (proporción 2:3) con QR, nombre, frase e instrucción. */
export function renderCardSvg(text: string, style: QrStyle, phrase: string = appConfig.tagline): string {
  const qr = renderQrSvg(text, { ...style, size: 760 });
  const W = 1200;
  const H = 1800;
  const qrData = qr.svg.replace(/^<svg /, `<svg x="220" y="560" `);
  const name = escapeXml(appConfig.name);
  const words = escapeXml(phrase).split(" ");
  // Ajuste simple de líneas para la frase.
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > 34) {
      lines.push(line.trim());
      line = w;
    } else line += ` ${w}`;
  }
  if (line.trim()) lines.push(line.trim());

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DCEEFF"/><stop offset="0.55" stop-color="#FAFAF7"/><stop offset="1" stop-color="#F4D6D6"/></linearGradient>` +
    `<radialGradient id="glow" cx="0.5" cy="0.18" r="0.5"><stop offset="0" stop-color="#FFF6DD"/><stop offset="1" stop-color="#FFF6DD" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>` +
    `<rect width="${W}" height="${H}" fill="url(#glow)"/>` +
    `<rect x="36" y="36" width="${W - 72}" height="${H - 72}" rx="56" fill="none" stroke="#D8B56A" stroke-width="4"/>` +
    // Paloma sencilla
    `<g transform="translate(520 120) scale(1.6)" fill="#fff" stroke="#25476A" stroke-width="3" stroke-linejoin="round"><path d="M14 58c14-8 34-10 52-6 8 2 15 0 20-6 5-4 11-2 13 2-4 0-6 1-8 4 0 12-10 22-26 24-8 1-14 5-19 12-1-7 1-12 5-16-17 2-30-3-37-14z"/><path d="M48 54C40 36 28 24 10 18c10 12 14 24 16 36 8 3 14 3 22 0z"/><path d="M52 54c3-18 13-32 32-40-3 13-3 25 0 34-9 6-20 8-32 6z"/></g>` +
    `<text x="600" y="370" text-anchor="middle" font-family="Lora, Georgia, 'Times New Roman', serif" font-size="78" font-weight="600" fill="#14283E">${name}</text>` +
    lines
      .map(
        (l, i) =>
          `<text x="600" y="${445 + i * 50}" text-anchor="middle" font-family="Lora, Georgia, serif" font-style="italic" font-size="38" fill="#25476A">${i === 0 ? "«" : ""}${l}${i === lines.length - 1 ? "»" : ""}</text>`,
      )
      .join("") +
    `<rect x="190" y="530" width="820" height="820" rx="48" fill="#fff" stroke="#E6E3DA" stroke-width="3"/>` +
    qrData +
    `<text x="600" y="1460" text-anchor="middle" font-family="'Nunito Sans', 'Segoe UI', Arial, sans-serif" font-size="44" font-weight="800" fill="#14283E" textLength="1000" lengthAdjust="spacingAndGlyphs">${escapeXml(appConfig.scanInstruction)}</text>` +
    `<text x="600" y="1530" text-anchor="middle" font-family="'Nunito Sans', 'Segoe UI', Arial, sans-serif" font-size="34" fill="#4F5D6B">Apunta la cámara de tu celular al código</text>` +
    `<g transform="translate(570 1600)"><rect x="24" y="0" width="12" height="70" rx="3" fill="#D8B56A"/><rect x="6" y="18" width="48" height="12" rx="3" fill="#D8B56A"/></g>` +
    `</svg>`
  );
}
