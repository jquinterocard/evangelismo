"use client";

import Link from "next/link";
import { Copy, Home, RefreshCw, Share2 } from "lucide-react";
import type { Teaching } from "@/types";
import { Button, buttonClass } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { usePublicBase } from "@/hooks/usePublicBase";
import { buildTeachingUrl } from "@/lib/urls";
import { copyText, shareOrCopy, whatsappShareUrl } from "@/lib/share";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { appConfig } from "@/lib/config";

export function TeachingActions({ teaching, onAnother }: { teaching: Teaching; onAnother?: () => void }) {
  const toast = useToast();
  const base = usePublicBase();
  const url = buildTeachingUrl(base, teaching.id);

  async function share() {
    const outcome = await shareOrCopy({
      title: `${teaching.title} · ${appConfig.name}`,
      text: `Una palabra de esperanza: «${teaching.title}» (${teaching.reference}).`,
      url,
    });
    if (outcome === "copied") toast("Enlace copiado para compartir.");
    if (outcome === "failed") toast("No se pudo compartir. Copia el enlace manualmente.", "error");
  }

  async function copy() {
    const ok = await copyText(url);
    toast(ok ? "Enlace copiado." : "No se pudo copiar el enlace.", ok ? "success" : "error");
  }

  const whatsapp = whatsappShareUrl(`Una palabra de esperanza: «${teaching.title}» (${teaching.reference}).`, url);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#1f8f4c] px-7 text-lg font-bold text-white shadow-[var(--shadow-soft)] transition hover:bg-[#187a40] active:scale-[0.98] motion-safe:hover:-translate-y-0.5 sm:col-span-2"
      >
        <WhatsAppIcon className="size-6" /> Compartir por WhatsApp
        <span className="sr-only">(se abre WhatsApp)</span>
      </a>
      {onAnother ? (
        <Button size="lg" variant="gold" onClick={onAnother} icon={<RefreshCw className="size-5" aria-hidden />}>
          Descubrir otra enseñanza
        </Button>
      ) : (
        <Link href="/ensenanza/" className={buttonClass("gold", "lg")}>
          <RefreshCw className="size-5" aria-hidden /> Descubrir otra enseñanza
        </Link>
      )}
      <Button size="lg" onClick={share} icon={<Share2 className="size-5" aria-hidden />}>
        Compartir este mensaje
      </Button>
      <Button size="lg" variant="secondary" onClick={copy} icon={<Copy className="size-5" aria-hidden />}>
        Copiar enlace
      </Button>
      <Link href="/" className={buttonClass("secondary", "lg")}>
        <Home className="size-5" aria-hidden /> Volver al inicio
      </Link>
    </div>
  );
}
