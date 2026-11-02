"use client";

import { useHydrated } from "./useStore";
import { resolvePublicBase } from "@/lib/urls";

/**
 * URL pública efectiva: la configurada en la compilación (NEXT_PUBLIC_SITE_URL)
 * o, si no existe (desarrollo local), la dirección actual del navegador + ruta base.
 */
export function usePublicBase(): string {
  const hydrated = useHydrated();
  return resolvePublicBase({ origin: hydrated ? window.location.origin : "" });
}
