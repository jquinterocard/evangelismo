import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { LearningOverview } from "@/features/learning/LearningProgress";

export const metadata: Metadata = {
  title: "Conociendo a Jesús",
  description: "Una ruta de aprendizaje en 10 temas para conocer a Jesús, a tu ritmo y sin registros.",
};

export default function LearningPathPage() {
  return (
    <>
      <PageHeader
        eyebrow="Ruta de aprendizaje"
        title="Conociendo a Jesús"
        illustration="path"
      />
      <div className="container-page py-10">
        <LearningOverview />
      </div>
    </>
  );
}
