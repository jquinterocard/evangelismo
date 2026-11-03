/** Instancias conectadas a Supabase (si está configurado). */
import { anonRpc } from "@/features/completions/client";
import { createFollowupApi } from "./api";

export const followupApi = createFollowupApi(anonRpc);
