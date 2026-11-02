/** Construcción y validación de URLs públicas, compatibles con rutas base (GitHub Pages). */
import { appConfig } from "./config";
import { isUuid } from "./uuid";

export type PublicUrlCheck = { ok: true; url: string } | { ok: false; message: string };

/**
 * Valida y normaliza la URL pública donde está publicada la app.
 * Acepta https (y http solo para localhost/redes locales durante pruebas).
 * Devuelve origen + ruta sin barra final, sin query ni hash.
 */
export function validatePublicUrl(input: string): PublicUrlCheck {
  const value = input.trim();
  if (!value) return { ok: false, message: "Escribe la URL pública del sitio." };
  if (value.length > 300) return { ok: false, message: "La URL es demasiado larga." };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, message: "La URL no es válida. Ejemplo: https://mi-proyecto.vercel.app" };
  }
  const isLocal = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)$/.test(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocal)) {
    return { ok: false, message: "Usa una dirección https:// (http solo se permite en localhost)." };
  }
  if (url.username || url.password) return { ok: false, message: "La URL no debe contener usuario ni contraseña." };
  if (url.search || url.hash) return { ok: false, message: "La URL no debe incluir parámetros (?) ni fragmentos (#)." };
  return { ok: true, url: `${url.origin}${url.pathname.replace(/\/+$/, "")}` };
}

/**
 * Determina la URL base pública efectiva:
 * 1. la configurada por el usuario (preferencias),
 * 2. la de compilación (NEXT_PUBLIC_SITE_URL),
 * 3. la ubicación actual del navegador + ruta base.
 */
export function resolvePublicBase(opts: {
  userUrl?: string;
  buildUrl?: string;
  origin?: string;
  basePath?: string;
}): string {
  const { userUrl, buildUrl = appConfig.siteUrl, basePath = appConfig.basePath } = opts;
  for (const candidate of [userUrl, buildUrl]) {
    if (candidate) {
      const res = validatePublicUrl(candidate);
      if (res.ok) return res.url;
    }
  }
  const origin = opts.origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${origin}${basePath}`;
}

/** URL que se codifica en el QR: {base}/?qr={uuid} */
export function buildQrUrl(publicBase: string, qrId: string): string {
  if (!isUuid(qrId)) throw new Error("Identificador de QR inválido");
  const base = publicBase.replace(/\/+$/, "");
  return `${base}/?qr=${qrId.toLowerCase()}`;
}

/** URL pública de una enseñanza concreta. */
export function buildTeachingUrl(publicBase: string, teachingId: string): string {
  const base = publicBase.replace(/\/+$/, "");
  return `${base}/ensenanzas/${encodeURIComponent(teachingId)}/`;
}

/** Lee y valida el parámetro ?qr= de una cadena de búsqueda. */
export function parseQrParam(search: string | URLSearchParams | null | undefined): {
  present: boolean;
  qrId: string | null;
} {
  if (!search) return { present: false, qrId: null };
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const raw = params.get("qr");
  if (raw === null) return { present: false, qrId: null };
  const v = raw.trim().slice(0, 64);
  return { present: true, qrId: isUuid(v) ? v.toLowerCase() : null };
}
