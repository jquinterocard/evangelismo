/**
 * Cliente de Supabase CON sesión, solo para el panel de mentores (/seguimiento/).
 * Se carga bajo demanda y guarda la sesión con una clave propia, separada del cliente
 * anónimo que usan los visitantes.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { appConfig } from "@/lib/config";
import { isSupabaseConfigured } from "@/features/completions/client";

let clientPromise: Promise<SupabaseClient> | null = null;

export function mentorAuthAvailable(): boolean {
  return isSupabaseConfigured();
}

export function getMentorClient(): Promise<SupabaseClient> {
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(appConfig.supabase.url, appConfig.supabase.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "uecj-mentor-auth" },
      }),
    );
  }
  return clientPromise;
}
