import { appConfig } from "./config";

/** Política de seguridad de contenido para el sitio estático (también se aplica vía <meta>). */
export function contentSecurityPolicy(supabaseUrl: string = appConfig.supabase.url): string {
  let supabaseOrigin = "";
  try {
    if (supabaseUrl) supabaseOrigin = new URL(supabaseUrl).origin;
  } catch {
    /* sin Supabase */
  }
  return [
    "default-src 'self'",
    // Next.js exportado usa scripts en línea para hidratar; no hay nonce en sitios estáticos.
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    // Narración pregenerada (public/audio).
    "media-src 'self'",
    `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
    "manifest-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}
