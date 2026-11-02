import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { ImpactDashboard } from "@/features/impact/ImpactDashboard";

export const metadata: Metadata = {
  title: "Impacto Evangelístico",
  description: "Metas, actividades registradas, finalizaciones globales y proyecciones de alcance.",
};

export default function ImpactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Impacto Evangelístico"
        title="Sembrar con esperanza"
        illustration="seed"
      />
      <div className="container-page flex flex-col gap-8 py-10">
        <ImpactDashboard />
      </div>
    </>
  );
}
