"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { usePublicBase } from "@/hooks/usePublicBase";
import { whatsappShareUrl } from "@/lib/share";
import { appConfig } from "@/lib/config";
import { WhatsAppIcon } from "./WhatsAppIcon";

function Fab() {
  const pathname = usePathname() ?? "/";
  const params = useSearchParams();
  const base = usePublicBase();
  // Donde se muestra una enseñanza ya hay un botón «Compartir por WhatsApp» propio.
  const onTeaching = params?.has("qr") || pathname.startsWith("/ensenanza/") || /^\/ensenanzas\/[^/]+\/?$/.test(pathname);
  // El panel privado de mentores no se comparte.
  const privatePage = pathname.startsWith("/seguimiento");
  if (onTeaching || privatePage || !base) return null;
  const url = `${base}${pathname === "/" ? "/" : pathname}`;
  const href = whatsappShareUrl(`Te comparto «${appConfig.name}»: un mensaje de esperanza para ti.`, url);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Compartir esta página por WhatsApp"
      title="Compartir por WhatsApp"
      className="no-print fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 grid size-14 place-items-center rounded-full bg-[#1f8f4c] text-white shadow-[0_8px_24px_-6px_rgb(0_0_0/0.35)] transition hover:scale-105 hover:bg-[#187a40] focus-visible:outline-3 xl:bottom-6"
    >
      <WhatsAppIcon className="size-8" />
    </a>
  );
}

/** Botón flotante para compartir la página actual por WhatsApp. */
export function WhatsAppFab() {
  return (
    <Suspense fallback={null}>
      <Fab />
    </Suspense>
  );
}
