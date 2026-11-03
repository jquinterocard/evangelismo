import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { MentorPanel } from "@/features/followup/MentorPanel";

export const metadata: Metadata = {
  title: "Seguimiento",
  description: "Panel privado para mentores: solicitudes de contacto de quienes quieren conocer más a Jesús.",
  robots: { index: false, follow: false },
};

export default function FollowupPage() {
  return (
    <>
      <PageHeader
        eyebrow="Panel de mentores"
        title="Seguimiento"
        description="Personas que pidieron que las contactemos. Trátalas con cariño, respeto y sin presiones."
        illustration="dove"
      />
      <div className="container-page flex flex-col gap-6 py-10">
        <MentorPanel />
      </div>
    </>
  );
}
