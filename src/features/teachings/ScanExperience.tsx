"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import type { Teaching } from "@/types";
import { categories } from "@/data/categories";
import { useHydrated } from "@/hooks/useStore";
import { Dove } from "@/components/illustrations";
import { CompletionPanel } from "@/features/completions/CompletionPanel";
import { teachingRepository } from "./repository";
import { cryptoRng, pickRandomTeaching } from "./random";
import { readRecent, rememberTeaching } from "./session-history";
import { TeachingArticle } from "./TeachingArticle";
import { TeachingActions } from "./TeachingActions";

function pick(excludeId?: string): Teaching | null {
  const recent = readRecent();
  return pickRandomTeaching(teachingRepository.active(), excludeId ? [...recent, excludeId] : recent, cryptoRng);
}

/**
 * Experiencia para quien abre un enlace de QR (/?qr=UUID) o pide una enseñanza al azar.
 * Abrir la URL no se considera un escaneo verificado.
 */
export function ScanExperience({ qrId, invalidQr = false }: { qrId: string | null; invalidQr?: boolean }) {
  const hydrated = useHydrated();
  const [current, setCurrent] = useState<Teaching | null>(null);
  const [view, setView] = useState(0);

  if (hydrated && current === null) {
    const first = pick();
    if (first) setCurrent(first);
  }

  useEffect(() => {
    if (current) rememberTeaching(current.id);
  }, [current]);

  function another() {
    const next = pick(current?.id);
    if (next) {
      setCurrent(next);
      setView((v) => v + 1);
      window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  }

  return (
    <div className="sky-gradient">
      <div className="container-page max-w-3xl py-8 sm:py-12">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Dove className="h-14 w-auto motion-safe:animate-float" />
          <p className="font-serif text-2xl leading-snug text-navy-ink sm:text-3xl">
            Hoy queremos compartir contigo una palabra de esperanza
          </p>
          {invalidQr && (
            <p className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm text-muted">
              <Info className="size-4" aria-hidden /> El código no es válido, pero esta enseñanza también es para ti.
            </p>
          )}
        </div>

        {current ? (
          <div key={`${current.id}-${view}`} className="flex flex-col gap-6 motion-safe:animate-fade-up">
            <TeachingArticle teaching={current} />
            <CompletionPanel
              key={`c-${current.id}-${view}`}
              teachingId={current.id}
              qrId={qrId}
              category={current.category}
              onAnother={another}
            />
            <TeachingActions teaching={current} onAnother={another} />
          </div>
        ) : (
          <div className="card flex min-h-80 items-center justify-center p-8" role="status">
            <p className="text-muted">Preparando una enseñanza para ti…</p>
          </div>
        )}

        <section className="mt-12" aria-labelledby="mas-sobre-jesus">
          <h2 id="mas-sobre-jesus" className="text-center text-2xl font-semibold">
            ¿Te gustaría conocer más sobre Jesús?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-muted">
            Explora otras enseñanzas por tema o recorre, a tu ritmo, la ruta «Conociendo a Jesús».
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {categories.slice(0, 8).map((c) => (
              <Link
                key={c.id}
                href={`/ensenanzas/?categoria=${c.id}`}
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-navy hover:border-navy"
              >
                {c.name}
              </Link>
            ))}
          </div>
          <div className="mt-5 flex justify-center">
            <Link href="/conociendo-a-jesus/" className="inline-flex items-center gap-2 font-bold text-navy underline underline-offset-4">
              Comenzar la ruta «Conociendo a Jesús» <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
