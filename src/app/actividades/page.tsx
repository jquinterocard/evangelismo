import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { LocalDataNotice } from "@/components/LocalDataNotice";
import { BackupPanel } from "@/components/BackupPanel";
import { ActivityManager } from "@/features/activities/ActivityManager";

export const metadata: Metadata = {
  title: "Actividades",
  description: "Registra tus actividades evangelísticas: QR y enseñanzas compartidas, visitas y personas interesadas reportadas.",
};

export default function ActivitiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Registro"
        title="Actividades evangelísticas"
        description="Anota lo que compartes cada día. Son registros personales para acompañar tu servicio, no una competencia."
        illustration="hands"
      />
      <div className="container-page flex flex-col gap-6 py-10">
        <LocalDataNotice />
        <ActivityManager />
        <BackupPanel />
      </div>
    </>
  );
}
