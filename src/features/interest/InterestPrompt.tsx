"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Heart, Home, MessageCircleHeart, RefreshCw } from "lucide-react";
import type { CategoryId } from "@/types";
import { categories } from "@/data/categories";
import { Button, buttonClass } from "@/components/ui/Button";
import { Dove } from "@/components/illustrations";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { appConfig } from "@/lib/config";
import { whatsappChatUrl } from "@/lib/share";
import { ContactForm } from "@/features/followup/ContactForm";
import type { FollowupApi } from "@/features/followup/api";
import { followupApi as defaultFollowupApi } from "@/features/followup/client";

/** Mensaje que llega al WhatsApp del equipo cuando alguien pide hablar. */
export function contactMessage(teachingTitle?: string) {
  return teachingTitle
    ? `Hola, leí la enseñanza «${teachingTitle}» y me gustaría hablar con alguien sobre Jesús.`
    : "Hola, me gustaría hablar con alguien sobre Jesús.";
}

/**
 * «¿Quieres hablar con alguien?»: WhatsApp directo (si hay número configurado) y,
 * si la respuesta quedó registrada, el formulario para que el equipo lo contacte.
 */
export function TalkToSomeone({
  teachingTitle,
  completionId,
  phone = appConfig.contact.whatsapp,
  followupApi = defaultFollowupApi,
}: {
  teachingTitle?: string;
  completionId?: string | null;
  phone?: string;
  followupApi?: FollowupApi;
}) {
  const [showForm, setShowForm] = useState(false);
  const canForm = Boolean(completionId) && followupApi.configured;
  if (!phone && !canForm) return null;
  return (
    <section className="flex w-full max-w-lg flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-5" aria-labelledby="hablar-con-alguien">
      <MessageCircleHeart className="size-8 text-navy" aria-hidden />
      <h3 id="hablar-con-alguien" className="font-serif text-xl font-semibold text-navy-ink">
        ¿Quieres hablar con alguien?
      </h3>
      <p className="text-sm text-muted">Una persona de nuestro equipo puede escucharte, orar contigo y responder tus preguntas.</p>
      {phone && (
        <a
          href={whatsappChatUrl(phone, contactMessage(teachingTitle))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#1f8f4c] px-5 text-lg font-bold whitespace-nowrap text-white shadow-[var(--shadow-soft)] transition hover:bg-[#187a40] active:scale-[0.98]"
        >
          <WhatsAppIcon className="size-6" /> Escribir por WhatsApp
        </a>
      )}
      {canForm &&
        completionId &&
        (showForm ? (
          <ContactForm completionId={completionId} api={followupApi} />
        ) : (
          <Button variant={phone ? "ghost" : "secondary"} size={phone ? "md" : "lg"} className="w-full" onClick={() => setShowForm(true)}>
            Prefiero que me contacten
          </Button>
        ))}
    </section>
  );
}

const RECOMMENDED: CategoryId[] = ["amor-de-dios", "salvacion", "oracion", "esperanza", "perdon", "paz"];

export function recommendedCategories(current?: CategoryId) {
  return RECOMMENDED.filter((c) => c !== current)
    .slice(0, 3)
    .map((id) => categories.find((c) => c.id === id)!);
}

export function PositiveFollowUp({
  currentCategory,
  onAnother,
  teachingTitle,
  completionId,
  contactPhone,
  followupApi,
}: {
  currentCategory?: CategoryId;
  onAnother?: () => void;
  teachingTitle?: string;
  completionId?: string | null;
  contactPhone?: string;
  followupApi?: FollowupApi;
}) {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <Heart className="size-10 fill-rose text-rose-ink" aria-hidden />
      <p className="max-w-xl font-serif text-xl leading-relaxed text-navy-ink">
        ¡Qué alegría que quieras seguir aprendiendo! ❤️ Cada enseñanza es una oportunidad para descubrir más sobre la vida, el amor y las palabras de Jesús.
      </p>
      <TalkToSomeone
        teachingTitle={teachingTitle}
        completionId={completionId}
        {...(contactPhone !== undefined ? { phone: contactPhone } : {})}
        {...(followupApi ? { followupApi } : {})}
      />
      <div className="flex w-full max-w-lg flex-col gap-3 sm:flex-row">
        <Link href="/conociendo-a-jesus/" className={buttonClass("gold", "lg", "flex-1")}>
          Ruta «Conociendo a Jesús» <ArrowRight className="size-5" aria-hidden />
        </Link>
        {onAnother ? (
          <Button size="lg" variant="secondary" className="flex-1" onClick={onAnother} icon={<RefreshCw className="size-5" aria-hidden />}>
            Otra enseñanza
          </Button>
        ) : (
          <Link href="/ensenanza/" className={buttonClass("secondary", "lg", "flex-1")}>
            <RefreshCw className="size-5" aria-hidden /> Otra enseñanza
          </Link>
        )}
      </div>
      <div className="w-full max-w-lg">
        <p className="mb-2 text-sm font-bold text-muted">Temas recomendados</p>
        <ul className="grid gap-2 sm:grid-cols-3">
          {recommendedCategories(currentCategory).map((c) => (
            <li key={c.id}>
              <Link
                href={`/ensenanzas/?categoria=${c.id}`}
                className="flex min-h-12 items-center justify-center rounded-xl border border-line bg-surface px-3 text-sm font-bold text-navy hover:border-navy"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function NegativeFollowUp() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Dove className="h-16 w-auto" />
      <p className="max-w-xl font-serif text-xl leading-relaxed text-navy-ink">
        Gracias por dedicar un momento a leer esta enseñanza. Que tengas un día lleno de paz y esperanza. 🕊️
      </p>
      <p className="text-sm text-muted">Puedes cerrar esta página cuando quieras.</p>
      <Link href="/" className={buttonClass("ghost", "md")}>
        <Home className="size-5" aria-hidden /> Volver al inicio
      </Link>
    </div>
  );
}

export function SkippedFollowUp({ onAnother }: { onAnother?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="max-w-xl font-serif text-xl leading-relaxed text-navy-ink">
        Está bien. Gracias por leer; aquí estaremos cuando quieras volver.
      </p>
      {onAnother ? (
        <Button size="lg" variant="secondary" onClick={onAnother} icon={<RefreshCw className="size-5" aria-hidden />}>
          Descubrir otra enseñanza
        </Button>
      ) : (
        <Link href="/ensenanza/" className={buttonClass("secondary", "lg")}>
          <RefreshCw className="size-5" aria-hidden /> Descubrir otra enseñanza
        </Link>
      )}
    </div>
  );
}
