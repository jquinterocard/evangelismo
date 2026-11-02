import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { LocalDataNotice } from "@/components/LocalDataNotice";
import { BackupPanel } from "@/components/BackupPanel";
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
        description="Sigue tus metas y actividades con responsabilidad. Los números acompañan el servicio; el crecimiento lo da Dios."
        illustration="seed"
      />
      <div className="container-page flex flex-col gap-8 py-10">
        <LocalDataNotice />
        <ImpactDashboard />
        <BackupPanel />
      </div>
    </>
  );
}
