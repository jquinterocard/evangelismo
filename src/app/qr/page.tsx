import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { QrGenerator } from "@/features/qr/QrGenerator";

export const metadata: Metadata = {
  title: "Generar código QR",
  description: "Crea códigos QR únicos que llevan a enseñanzas bíblicas aleatorias. Descarga PNG, SVG, tarjetas o lotes ZIP.",
};

export default function QrPage() {
  return (
    <>
      <PageHeader
        eyebrow="Generador"
        title="Códigos QR de esperanza"
        description="Cada código abre una enseñanza bíblica diferente. Personalízalo, descárgalo e imprímelo en tarjetas para compartir."
        illustration="cross"
      />
      <div className="container-page flex flex-col gap-6 py-10">
        <QrGenerator />
      </div>
    </>
  );
}
