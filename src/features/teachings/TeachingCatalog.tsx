"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { Search, Share2 } from "lucide-react";
import type { CategoryId, Teaching } from "@/types";
import { categories, categoryById } from "@/data/categories";
import { CategoryIcon } from "@/components/CategoryIcon";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { usePublicBase } from "@/hooks/usePublicBase";
import { buildTeachingUrl } from "@/lib/urls";
import { shareOrCopy } from "@/lib/share";
import { teachingRepository } from "./repository";

function isCategory(v: string | null): v is CategoryId {
  return !!v && v in categoryById;
}

export function TeachingCatalog() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const base = usePublicBase();
  const searchId = useId();
  const catParam = params.get("categoria");
  const category: CategoryId | "all" = isCategory(catParam) ? catParam : "all";
  const [query, setQuery] = useState("");
  const results = useMemo(() => teachingRepository.search(query, category), [query, category]);

  function setCategory(c: CategoryId | "all") {
    router.replace(c === "all" ? "/ensenanzas/" : `/ensenanzas/?categoria=${c}`, { scroll: false });
  }

  async function share(t: Teaching) {
    const outcome = await shareOrCopy({ title: t.title, text: `«${t.title}» (${t.reference})`, url: buildTeachingUrl(base, t.id) });
    if (outcome === "copied") toast("Enlace copiado.");
    if (outcome === "failed") toast("No se pudo compartir.", "error");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 md:grid-cols-[1fr_18rem]">
        <div>
          <label htmlFor={searchId} className="label">
            Buscar por título o referencia
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted" aria-hidden />
            <input
              id={searchId}
              type="search"
              className="field pl-10"
              placeholder="Ej.: paz, Juan 3:16…"
              value={query}
              maxLength={100}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor={`${searchId}-cat`} className="label">
            Tema
          </label>
          <select
            id={`${searchId}-cat`}
            className="field"
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryId | "all")}
          >
            <option value="all">Todos los temas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-muted" aria-live="polite">
        {results.length === 1 ? "1 enseñanza encontrada" : `${results.length} enseñanzas encontradas`}
        {category !== "all" && ` en «${categoryById[category].name}»`}
      </p>

      {results.length === 0 ? (
        <EmptyState
          title="No encontramos enseñanzas"
          description="Prueba con otra palabra o elige otro tema."
          illustration="bible"
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((t) => {
            const c = categoryById[t.category];
            return (
              <li key={t.id} className="card flex flex-col gap-3 p-5">
                <p className="flex items-center gap-2 text-sm font-bold text-gold-ink">
                  <CategoryIcon name={c.icon} className="size-4" /> {c.name}
                </p>
                <h2 className="text-xl font-semibold leading-snug">
                  <Link href={`/ensenanzas/${t.id}/`} className="hover:underline">
                    {t.title}
                  </Link>
                </h2>
                <p className="font-bold text-navy">{t.reference}</p>
                <p className="line-clamp-3 text-muted">{t.verseText}</p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <Link href={`/ensenanzas/${t.id}/`} className="min-h-11 content-center font-bold text-navy underline underline-offset-4">
                    Ver enseñanza
                  </Link>
                  <button
                    type="button"
                    onClick={() => share(t)}
                    className="grid size-11 place-items-center rounded-full text-navy hover:bg-sky-soft"
                    aria-label={`Compartir «${t.title}»`}
                  >
                    <Share2 className="size-5" aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
