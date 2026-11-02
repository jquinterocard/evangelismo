"use client";

import { useStore, useHydrated } from "./useStore";
import { preferencesStore } from "@/lib/stores";
import { resolvePublicBase } from "@/lib/urls";

/** URL pública efectiva (preferencia del usuario > variable de build > ubicación actual). */
export function usePublicBase(): string {
  const prefs = useStore(preferencesStore);
  const hydrated = useHydrated();
  return resolvePublicBase({ userUrl: prefs.publicUrl, origin: hydrated ? window.location.origin : "" });
}
