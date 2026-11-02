import type { Metadata } from "next";
import { BookOpen, HeartHandshake, QrCode } from "lucide-react";
import { appConfig } from "@/lib/config";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { teachingRepository } from "@/features/teachings/repository";

export const metadata: Metadata = {
  title: "Acerca del proyecto",
  description: appConfig.project.purpose,
};

const items = [
  { icon: QrCode, title: "Un código, una enseñanza", text: "Cada QR tiene un identificador aleatorio. Al escanearlo se muestra una enseñanza bíblica distinta, elegida al azar en el propio celular." },
  { icon: BookOpen, title: "Contenido centrado en Jesús", text: `${teachingRepository.active().length} enseñanzas originales en 20 temas, con referencias bíblicas verificables, reflexión, aplicación práctica y oración sugerida.` },
  { icon: HeartHandshake, title: "Sin competencias", text: "Los indicadores ayudan a perseverar y planificar, no miden el valor espiritual de nadie. Cada persona responde a Dios con libertad." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="Acerca" title={appConfig.name} description={`«${appConfig.tagline}».`} illustration="dove" />
      <div className="container-page flex max-w-4xl flex-col gap-10 py-10">
        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-semibold">Propósito</h2>
          <p className="text-lg">{appConfig.project.purpose}</p>
          <p className="text-muted">
            El objetivo no es competir por conversiones, sino facilitar que más personas escuchen del amor de Dios revelado en Jesucristo y
            acompañar con responsabilidad a quienes comparten este mensaje.
          </p>
        </section>
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((i) => (
            <li key={i.title} className="card flex gap-4 p-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky text-navy">
                <i.icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold text-navy-ink">{i.title}</span>
                <span className="text-muted">{i.text}</span>
              </span>
            </li>
          ))}
        </ul>
        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-semibold">Cómo participar</h2>
          <ol className="list-inside list-decimal space-y-1">
            <li>Genera tus códigos QR y descarga las tarjetas listas para imprimir.</li>
            <li>Compártelos con respeto: en tu barrio, trabajo, iglesia o con tu familia.</li>
            <li>Mira en Impacto cuántas enseñanzas se completaron y cuántas respuestas pidieron seguir conociendo a Jesús.</li>
          </ol>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/qr/" icon={<QrCode className="size-5" aria-hidden />}>
              Generar código QR
            </LinkButton>
            <LinkButton href="/ensenanzas/" variant="secondary" icon={<BookOpen className="size-5" aria-hidden />}>
              Ver enseñanzas
            </LinkButton>
          </div>
        </section>
      </div>
    </>
  );
}
