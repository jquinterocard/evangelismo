import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { ImpactDashboard } from "@/features/impact/ImpactDashboard";

export const metadata: Metadata = {
  title: "Impacto Evangelístico",
  description: "Enseñanzas completadas y respuestas voluntarias de quienes escanean los códigos QR.",
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
