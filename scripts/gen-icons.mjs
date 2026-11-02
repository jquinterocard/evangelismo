// Genera los íconos PWA (PNG) a partir del logo SVG original. Uso: npm run gen:icons
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const logo = (pad = 0) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${64 + pad * 2} ${64 + pad * 2}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2F5A84"/><stop offset="1" stop-color="#1A3450"/></linearGradient></defs>
  <rect x="${-pad}" y="${-pad}" width="${64 + pad * 2}" height="${64 + pad * 2}" rx="${pad ? 0 : 16}" fill="url(#g)"/>
  <path d="M32 52C17 42 10 34 10 25c0-7 5.5-12 12-12 4.4 0 8 2.4 10 6 2-3.6 5.6-6 10-6 6.5 0 12 5 12 12 0 9-7 17-22 27z" fill="none" stroke="#D8B56A" stroke-width="2.6"/>
  <rect x="30" y="20" width="4" height="22" rx="1" fill="#FAFAF7"/><rect x="24.5" y="25.5" width="15" height="4" rx="1" fill="#FAFAF7"/>
</svg>`;

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon.svg", logo());
const jobs = [
  ["public/icons/icon-192.png", 192, 0],
  ["public/icons/icon-512.png", 512, 0],
  ["public/icons/maskable-512.png", 512, 12],
  ["public/icons/apple-touch-icon.png", 180, 6],
  ["public/favicon.png", 48, 0],
];
for (const [file, size, pad] of jobs) {
  await sharp(Buffer.from(logo(pad))).resize(size, size).png({ compressionLevel: 9 }).toFile(file);
  console.log(file);
}
