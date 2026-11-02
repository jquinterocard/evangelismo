/** Instancia del API de finalizaciones conectada a Supabase si hay variables configuradas. */
import { appConfig } from "@/lib/config";
import { getSafeStorage } from "@/lib/storage";
import { generateUuid, isUuid } from "@/lib/uuid";
import { createCompletionsApi, type CompletionsApi, type RpcFn } from "./api";

export function isSupabaseConfigured(url = appConfig.supabase.url, key = appConfig.supabase.anonKey): boolean {
  if (!url || !key) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.hostname === "localhost" || u.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

let rpcPromise: Promise<RpcFn> | null = null;

function lazyRpc(): RpcFn {
  return async (fn, args) => {
    if (!rpcPromise) {
      rpcPromise = import("@supabase/supabase-js").then(({ createClient }) => {
        const client = createClient(appConfig.supabase.url, appConfig.supabase.anonKey, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        });
        return (async (name: string, params: Record<string, unknown>) => {
          const { data, error } = await client.rpc(name, params);
          return { data, error: error ? { message: error.message } : null };
        }) as RpcFn;
      });
    }
    const rpc = await rpcPromise;
    return rpc(fn, args);
  };
}

export const completionsApi: CompletionsApi = createCompletionsApi(isSupabaseConfigured() ? lazyRpc() : null);

const SESSION_KEY = "uecj:session-id";

/**
 * Identificador aleatorio de sesión (sessionStorage): se borra al cerrar la pestaña.
 * No identifica a ninguna persona ni prueba que sea un visitante único.
 */
export function getSessionId(): string {
  const storage = getSafeStorage("session");
  const existing = storage?.getItem(SESSION_KEY);
  if (isUuid(existing)) return existing;
  const id = generateUuid();
  try {
    storage?.setItem(SESSION_KEY, id);
  } catch {
    /* sin storage: id efímero por carga */
  }
  return id;
}

/** Zona horaria del navegador para agrupar estadísticas por día. */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
