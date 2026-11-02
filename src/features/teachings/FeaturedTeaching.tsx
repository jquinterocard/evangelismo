"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import type { Teaching } from "@/types";
import { getCategory } from "@/data/categories";
import { useHydrated } from "@/hooks/useStore";
import { Illustration } from "@/components/illustrations";
import { Button } from "@/components/ui/Button";
import { teachingRepository } from "./repository";
import { cryptoRng, pickRandomTeaching } from "./random";

/** Mensaje destacado elegido al azar en el navegador. */
export function FeaturedTeaching() {
  const hydrated = useHydrated();
  const [teaching, setTeaching] = useState<Teaching | null>(null);
  if (hydrated && !teaching) setTeaching(pickRandomTeaching(teachingRepository.active(), [], cryptoRng));

  if (!teaching) {
    return <div className="card min-h-72 animate-pulse bg-white/70" aria-hidden />;
  }
  const category = getCategory(teaching.category);
  return (
    <div className="card grid gap-6 overflow-hidden p-6 sm:grid-cols-[auto_1fr] sm:p-8" aria-live="polite">
      <Illustration name={teaching.illustration ?? category.illustration} className="mx-auto h-32 w-auto sm:h-40" />
      <div className="flex flex-col gap-3">
        <p className="text-sm font-bold text-gold-ink">{category.name}</p>
        <h3 className="text-2xl font-semibold">{teaching.title}</h3>
        <blockquote className="font-serif text-lg leading-relaxed text-navy-ink italic">“{teaching.verseText}”</blockquote>
        <p className="font-bold text-muted">{teaching.reference} (NVI)</p>
        <p className="text-muted">{teaching.reflection}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link href={`/ensenanzas/${teaching.id}/`} className="inline-flex min-h-12 items-center gap-2 font-bold text-navy underline underline-offset-4">
            Leer la enseñanza completa <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Button
            variant="ghost"
            size="md"
            onClick={() => setTeaching(pickRandomTeaching(teachingRepository.active(), [teaching.id], cryptoRng))}
            icon={<RefreshCw className="size-4" aria-hidden />}
          >
            Otro mensaje
          </Button>
        </div>
      </div>
    </div>
  );
}
