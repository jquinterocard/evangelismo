import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TeachingCatalog } from "@/features/teachings/TeachingCatalog";
import { teachingRepository } from "@/features/teachings/repository";

export const metadata: Metadata = {
  title: "Enseñanzas",
  description: "Explora todas las enseñanzas bíblicas por tema o busca por título y referencia.",
};

export default function TeachingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Enseñanzas bíblicas"
        description={`${teachingRepository.active().length} enseñanzas centradas en Jesucristo, organizadas en 20 temas.`}
        illustration="bible"
      />
      <div className="container-page py-10">
        <Suspense fallback={<p className="text-muted">Cargando catálogo…</p>}>
          <TeachingCatalog />
        </Suspense>
      </div>
    </>
  );
}
