"use client";

import { BookCheck, Sparkles } from "lucide-react";
import { useHydrated } from "@/hooks/useStore";
import { GlobalImpact } from "./GlobalImpact";

const MESSAGES = [
  "«Vayan y hagan discípulos de todas las naciones» (Mateo 28:19). Cada semilla sembrada con amor cuenta.",
  "No se trata de números, sino de personas amadas por Dios. Gracias por compartir esperanza.",
  "La fidelidad en lo pequeño también es servicio. Sigue sembrando; Dios da el crecimiento (1 Corintios 3:6).",
];

/** Impacto: lo que hacen los visitantes al escanear (finalizaciones y respuestas voluntarias). */
export function ImpactDashboard() {
  const hydrated = useHydrated();
  const message = MESSAGES[new Date().getDate() % MESSAGES.length];

  if (!hydrated) return <div className="card h-96 animate-pulse" aria-hidden />;

  return (
    <div className="flex flex-col gap-10">
      <p className="flex items-start gap-3 rounded-2xl bg-gold-soft/70 p-4 font-serif text-lg text-navy-ink">
        <Sparkles className="mt-1 size-5 shrink-0 text-gold-ink" aria-hidden /> {message}
      </p>

      <GlobalImpact />

      <aside className="rounded-2xl border border-line bg-surface p-5 text-sm text-muted">
        <p className="flex items-center gap-2 font-bold text-navy-ink">
          <BookCheck className="size-4" aria-hidden /> Sobre estos indicadores
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Son respuestas voluntarias y anónimas, no una medición del valor espiritual de ninguna persona.</li>
          <li>Una enseñanza completada no equivale a una persona única ni a una conversión.</li>
          <li>Las proyecciones son estimaciones basadas exclusivamente en los datos registrados.</li>
          <li>Esto no es una competencia: cada persona es amada por Dios y responde con libertad.</li>
        </ul>
      </aside>
    </div>
  );
}
