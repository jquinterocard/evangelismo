/**
 * Configuración centralizada de la aplicación.
 * Ningún componente debe escribir dominios ni rutas base directamente: todo sale de aquí.
 */

function normalizeBasePath(value: string | undefined): string {
  const v = (value ?? "").trim();
  if (!v || v === "/") return "";
  return `/${v.replace(/^\/+|\/+$/g, "")}`;
}

function normalizeSiteUrl(value: string | undefined): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  try {
    const url = new URL(v);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return "";
  }
}

export const appConfig = {
  name: "Un Encuentro con Jesús",
  shortName: "Encuentro",
  tagline: "Un código, una enseñanza, una oportunidad para conocer a Jesús",
  description:
    "Plataforma de evangelización digital: escanea un código QR y recibe una enseñanza bíblica con reflexión, aplicación práctica y oración.",
  heroSubtitle: "Cada mensaje es una oportunidad para descubrir el amor de Dios",
  scanInstruction: "Escanea y descubre un mensaje de esperanza",
  locale: "es",
  /** URL pública configurada en el build (puede estar vacía). */
  siteUrl: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  /** Ruta base (vacía o "/repo"). */
  basePath: normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH),
  colors: {
    warmWhite: "#FAFAF7",
    sky: "#DCEEFF",
    deepBlue: "#25476A",
    gold: "#D8B56A",
    hope: "#7DAE92",
    rose: "#F4D6D6",
  },
  bible: {
    version: "NVI",
    copyright:
      "Texto bíblico tomado de la Santa Biblia, NUEVA VERSIÓN INTERNACIONAL® NVI® © 1999, 2015, 2022 por Biblica, Inc.®, Inc.® Usado con permiso de Biblica, Inc.® Reservados todos los derechos en todo el mundo.",
    /** Enlace externo para leer el pasaje completo. */
    passageUrl: (reference: string) =>
      `https://www.biblegateway.com/passage/?search=${encodeURIComponent(reference)}&version=NVI`,
  },
  project: {
    purpose:
      "Facilitar la difusión del evangelio de Jesucristo mediante códigos QR que llevan a enseñanzas bíblicas breves, y acompañar con responsabilidad las actividades evangelísticas.",
    values: ["Centrado en Jesucristo", "Respeto a cada persona", "Privacidad", "Gratuito"],
  },
  supabase: {
    url: (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim(),
    anonKey: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim(),
  },
} as const;

export const internal = { normalizeBasePath, normalizeSiteUrl };

/** Antepone la ruta base a una ruta interna (para recursos fuera de next/link, p. ej. manifest o sw). */
export function withBasePath(path: string, basePath: string = appConfig.basePath): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${p}`;
}
