import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { teachingRepository } from "@/features/teachings/repository";
import { TeachingArticle } from "@/features/teachings/TeachingArticle";
import { TeachingActions } from "@/features/teachings/TeachingActions";
import { CompletionPanel } from "@/features/completions/CompletionPanel";

export const dynamicParams = false;

export function generateStaticParams() {
  return teachingRepository.all().map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/ensenanzas/[id]">): Promise<Metadata> {
  const { id } = await params;
  const t = teachingRepository.byId(id);
  if (!t) return {};
  return { title: t.title, description: `${t.reference} — ${t.reflection.slice(0, 150)}` };
}

export default async function TeachingPage({ params }: PageProps<"/ensenanzas/[id]">) {
  const { id } = await params;
  const teaching = teachingRepository.byId(id);
  if (!teaching || !teaching.active) notFound();
  return (
    <div className="sky-gradient">
      <div className="container-page max-w-3xl py-8 sm:py-12">
        <Link href="/ensenanzas/" className="mb-5 inline-flex min-h-11 items-center gap-1 font-bold text-navy">
          <ChevronLeft className="size-5" aria-hidden /> Todas las enseñanzas
        </Link>
        <div className="flex flex-col gap-6">
          <TeachingArticle teaching={teaching} />
          <CompletionPanel teachingId={teaching.id} qrId={null} category={teaching.category} />
          <TeachingActions teaching={teaching} />
        </div>
      </div>
    </div>
  );
}
