import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { GoalManager } from "@/features/goals/GoalManager";

export const metadata: Metadata = {
  title: "Metas evangelísticas",
  description: "Define metas diarias, semanales, mensuales o anuales y sigue su progreso con proyecciones basadas en tus registros.",
};

export default function GoalsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Metas"
        title="Metas evangelísticas"
        illustration="path"
      />
      <div className="container-page flex flex-col gap-6 py-10">
        <GoalManager />
      </div>
    </>
  );
}
