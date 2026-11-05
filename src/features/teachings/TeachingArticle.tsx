import { BookOpenText, ExternalLink, HandHeart, Lightbulb, ScrollText, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import type { Teaching } from "@/types";
import { getCategory } from "@/data/categories";
import { appConfig } from "@/lib/config";
import { Illustration } from "@/components/illustrations";
import { ListenPanel } from "@/features/audio/ListenPanel";
import { TEACHING_SECTIONS, type SectionKey } from "@/features/audio/speech-text";

function Block({
  icon,
  title,
  children,
  tone = "plain",
  listen,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  tone?: "plain" | "hope" | "rose";
  /** Sección del reproductor de voz que corresponde a este bloque. */
  listen: SectionKey;
}) {
  const bg = tone === "hope" ? "bg-hope-soft/70 border-hope/40" : tone === "rose" ? "bg-rose/35 border-rose" : "bg-surface border-line";
  return (
    <section id={`listen-${listen}`} className={`scroll-mt-24 rounded-2xl border p-5 sm:p-6 ${bg}`}>
      <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
        <span className="text-gold-ink" aria-hidden>
          {icon}
        </span>
        {title}
      </h3>
      <div className="prose-teaching text-ink">{children}</div>
    </section>
  );
}

export function TeachingArticle({ teaching, headingLevel = "h1" }: { teaching: Teaching; headingLevel?: "h1" | "h2" }) {
  const category = getCategory(teaching.category);
  const H = headingLevel;
  return (
    <article className="flex flex-col gap-5" aria-labelledby={`t-${teaching.id}`}>
      <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-sky to-cream px-5 pt-6 pb-7 text-center sm:px-10">
        <Illustration name={teaching.illustration ?? category.illustration} className="mx-auto h-28 w-auto motion-safe:animate-float sm:h-36" />
        <p className="mt-4 inline-flex rounded-full bg-surface/80 px-3 py-1 text-sm font-bold text-navy">{category.name}</p>
        <H id={`t-${teaching.id}`} className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
          {teaching.title}
        </H>
        <figure id="listen-verse" className="mx-auto mt-5 max-w-2xl rounded-xl">
          <blockquote className="font-serif text-xl leading-relaxed text-navy-ink italic sm:text-2xl">
            “{teaching.verseText}”
          </blockquote>
          <figcaption className="mt-3 text-base font-bold text-gold-ink">
            {teaching.reference} <span className="font-semibold text-muted">({appConfig.bible.version})</span>
          </figcaption>
        </figure>
        <a
          href={appConfig.bible.passageUrl(teaching.reference)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-navy underline underline-offset-4"
        >
          Leer el pasaje completo <ExternalLink className="size-4" aria-hidden />
          <span className="sr-only">(se abre en una pestaña nueva)</span>
        </a>
      </div>

      <ListenPanel audioId={teaching.id} title={teaching.title} sections={TEACHING_SECTIONS} />

      <Block icon={<ScrollText className="size-5" />} title="Contexto bíblico" listen="context">
        <p>{teaching.context}</p>
      </Block>
      <Block icon={<BookOpenText className="size-5" />} title="Explicación" listen="explanation">
        <p>{teaching.explanation}</p>
      </Block>
      <Block icon={<Sparkles className="size-5" />} title="Reflexión" tone="rose" listen="reflection">
        <p>{teaching.reflection}</p>
      </Block>
      <Block icon={<Lightbulb className="size-5" />} title="Para vivirlo hoy" tone="hope" listen="application">
        <p>{teaching.application}</p>
      </Block>
      <Block icon={<HandHeart className="size-5" />} title="Oración sugerida" listen="prayer">
        <p className="mb-2 text-sm text-muted">Si lo deseas, puedes orar con estas palabras:</p>
        <p className="font-serif text-lg italic">{teaching.prayer}</p>
      </Block>
    </article>
  );
}
