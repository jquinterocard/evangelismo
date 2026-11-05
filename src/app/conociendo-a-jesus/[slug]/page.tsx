import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, ExternalLink, Lightbulb, Sparkles } from "lucide-react";
import { learningPath } from "@/data/learning-path";
import { appConfig } from "@/lib/config";
import { Illustration } from "@/components/illustrations";
import { MarkTopicRead } from "@/features/learning/LearningProgress";
import { ListenPanel } from "@/features/audio/ListenPanel";
import { TOPIC_SECTIONS, topicAudioId } from "@/features/audio/speech-text";

export const dynamicParams = false;

export function generateStaticParams() {
  return learningPath.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/conociendo-a-jesus/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = learningPath.find((x) => x.slug === slug);
  return t ? { title: `${t.title} · Conociendo a Jesús`, description: t.summary } : {};
}

export default async function TopicPage({ params }: PageProps<"/conociendo-a-jesus/[slug]">) {
  const { slug } = await params;
  const index = learningPath.findIndex((t) => t.slug === slug);
  if (index < 0) notFound();
  const topic = learningPath[index];
  const prev = learningPath[index - 1];
  const next = learningPath[index + 1];

  return (
    <div className="sky-gradient">
      <div className="container-page max-w-3xl py-8 sm:py-12">
        <Link href="/conociendo-a-jesus/" className="mb-5 inline-flex min-h-11 items-center gap-1 font-bold text-navy">
          <ChevronLeft className="size-5" aria-hidden /> Ruta «Conociendo a Jesús»
        </Link>
        <article className="flex flex-col gap-6">
          <header className="rounded-3xl border border-line bg-gradient-to-b from-sky to-cream px-5 py-8 text-center sm:px-10">
            <Illustration name={topic.illustration} className="mx-auto h-28 w-auto" />
            <p className="mt-4 text-sm font-extrabold tracking-[0.14em] text-gold-ink uppercase">
              Tema {topic.order} de {learningPath.length}
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{topic.title}</h1>
            <p className="mx-auto mt-3 max-w-xl text-lg text-muted">{topic.summary}</p>
          </header>

          <ListenPanel audioId={topicAudioId(topic.slug)} title={topic.title} sections={TOPIC_SECTIONS} />

          <section id="listen-verse" className="scroll-mt-24 card flex flex-col gap-4 p-5 sm:p-6" aria-labelledby="refs">
            <h2 id="refs" className="text-xl font-semibold">
              Lo que dice la Biblia
            </h2>
            <ul className="flex flex-col gap-4">
              {topic.references.map((r) => (
                <li key={r.reference}>
                  {r.text && <blockquote className="font-serif text-lg leading-relaxed text-navy-ink italic">“{r.text}”</blockquote>}
                  <a
                    href={appConfig.bible.passageUrl(r.reference)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex min-h-10 items-center gap-1 font-bold text-gold-ink underline underline-offset-4"
                  >
                    {r.reference} ({appConfig.bible.version}) <ExternalLink className="size-4" aria-hidden />
                    <span className="sr-only">(se abre en una pestaña nueva)</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section id="listen-explanation" className="scroll-mt-24 card flex flex-col gap-3 p-5 sm:p-6" aria-labelledby="exp">
            <h2 id="exp" className="text-xl font-semibold">
              Explicación
            </h2>
            {topic.explanation.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>

          <section id="listen-reflection" className="scroll-mt-24 rounded-2xl border border-rose bg-rose/35 p-5 sm:p-6" aria-labelledby="refl">
            <h2 id="refl" className="mb-2 flex items-center gap-2 text-xl font-semibold">
              <Sparkles className="size-5 text-gold-ink" aria-hidden /> Reflexión
            </h2>
            <p>{topic.reflection}</p>
          </section>

          <section id="listen-application" className="scroll-mt-24 rounded-2xl border border-hope/40 bg-hope-soft/70 p-5 sm:p-6" aria-labelledby="act">
            <h2 id="act" className="mb-2 flex items-center gap-2 text-xl font-semibold">
              <Lightbulb className="size-5 text-gold-ink" aria-hidden /> Actividad práctica <span className="text-base font-normal text-muted">(opcional)</span>
            </h2>
            <p>{topic.activity}</p>
          </section>

          <div className="flex justify-center">
            <MarkTopicRead slug={topic.slug} />
          </div>

          <nav aria-label="Temas de la ruta" className="grid grid-cols-2 gap-3">
            {prev ? (
              <Link href={`/conociendo-a-jesus/${prev.slug}/`} className="card flex min-h-16 items-center gap-2 p-4 font-bold text-navy">
                <ChevronLeft className="size-5 shrink-0" aria-hidden /> <span className="line-clamp-2">{prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/conociendo-a-jesus/${next.slug}/`} className="card flex min-h-16 items-center justify-end gap-2 p-4 text-right font-bold text-navy">
                <span className="line-clamp-2">{next.title}</span> <ChevronRight className="size-5 shrink-0" aria-hidden />
              </Link>
            ) : (
              <Link href="/ensenanza/" className="card flex min-h-16 items-center justify-end gap-2 p-4 text-right font-bold text-navy">
                <span>Recibir una enseñanza</span> <ChevronRight className="size-5 shrink-0" aria-hidden />
              </Link>
            )}
          </nav>
        </article>
      </div>
    </div>
  );
}
