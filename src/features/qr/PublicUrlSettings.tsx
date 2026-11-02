"use client";

import { useId, useState } from "react";
import { Globe, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/hooks/useStore";
import { usePublicBase } from "@/hooks/usePublicBase";
import { preferencesStore } from "@/lib/stores";
import { validatePublicUrl } from "@/lib/urls";
import { appConfig } from "@/lib/config";

export function PublicUrlSettings() {
  const prefs = useStore(preferencesStore);
  const effective = usePublicBase();
  const toast = useToast();
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const value = draft ?? prefs.publicUrl ?? "";

  function save() {
    const res = validatePublicUrl(value);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    const w = preferencesStore.update((p) => ({ ...p, publicUrl: res.url }));
    if (!w.ok) return toast(w.message, "error");
    setDraft(null);
    setError(null);
    toast("URL pública guardada.");
  }

  function reset() {
    preferencesStore.update((p) => ({ ...p, publicUrl: undefined }));
    setDraft(null);
    setError(null);
    toast("Se usará la URL predeterminada.", "info");
  }

  return (
    <section className="card p-5 sm:p-6" aria-labelledby={`${id}-t`}>
      <h2 id={`${id}-t`} className="flex items-center gap-2 text-xl font-semibold">
        <Globe className="size-5 text-gold-ink" aria-hidden /> URL pública del sitio
      </h2>
      <p className="mt-1 text-sm text-muted">
        Los códigos QR apuntarán a esta dirección. Configúrala con la URL donde publicaste la app (por ejemplo, tu subdominio
        de Vercel o GitHub Pages). {appConfig.siteUrl ? "Si la dejas vacía se usa la configurada en la compilación." : "Si la dejas vacía se usa la dirección actual del navegador."}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor={id} className="label">
            URL pública
          </label>
          <input
            id={id}
            type="url"
            inputMode="url"
            className="field"
            placeholder="https://mi-proyecto.vercel.app"
            value={value}
            maxLength={300}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-err` : `${id}-eff`}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={save} icon={<Save className="size-4" aria-hidden />}>
            Guardar
          </Button>
          {prefs.publicUrl && (
            <Button variant="ghost" onClick={reset} icon={<RotateCcw className="size-4" aria-hidden />}>
              Restablecer
            </Button>
          )}
        </div>
      </div>
      {error ? (
        <p id={`${id}-err`} role="alert" className="mt-2 text-sm font-semibold text-rose-ink">
          {error}
        </p>
      ) : (
        <p id={`${id}-eff`} className="mt-2 text-sm break-all text-muted">
          En uso: <code className="rounded bg-sky-soft px-1.5 py-0.5 text-navy">{effective || "—"}/?qr=…</code>
        </p>
      )}
    </section>
  );
}
