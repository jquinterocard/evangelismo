import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
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
        illustration="hands"
      />
      <div className="container-page flex flex-col gap-6 py-10">
        <ActivityManager />
        <BackupPanel />
      </div>
    </>
  );
}
