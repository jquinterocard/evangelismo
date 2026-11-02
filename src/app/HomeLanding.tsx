import Link from "next/link";
import { BookOpen, Info, QrCode, ScanLine, Share2, HeartHandshake } from "lucide-react";
import { appConfig } from "@/lib/config";
import { categories } from "@/data/categories";
import { LinkButton } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Dove, HopePath, JesusOpenArms, LightRays, OliveBranch } from "@/components/illustrations";
import { FeaturedTeaching } from "@/features/teachings/FeaturedTeaching";

const steps = [
  { icon: QrCode, title: "Genera un código", text: "Crea códigos QR únicos e imprímelos en tarjetas, volantes o carteles." },
  { icon: ScanLine, title: "Alguien lo escanea", text: "Con la cámara de su celular abre una enseñanza bíblica elegida al azar." },
  { icon: BookOpen, title: "Descubre a Jesús", text: "Lee una reflexión, una aplicación práctica y una oración. Sin registros ni datos personales." },
];

export function HomeLanding() {
  return (
    <>
      {/* Hero */}
      <section className="sky-gradient relative overflow-hidden">
        <LightRays className="pointer-events-none absolute -top-40 left-1/2 w-[56rem] max-w-none -translate-x-1/2 opacity-70 motion-safe:animate-glow" />
        <div className="container-page relative grid items-center gap-8 pt-10 pb-14 sm:pt-16 md:grid-cols-[1.1fr_0.9fr] md:pb-20">
          <div className="flex flex-col items-center gap-5 text-center md:items-start md:text-left">
            <p className="rounded-full bg-white/80 px-4 py-1.5 text-sm font-bold text-gold-ink shadow-sm">{appConfig.tagline}</p>
            <h1 className="text-4xl leading-[1.1] font-semibold sm:text-5xl lg:text-6xl">{appConfig.name}</h1>
            <p className="max-w-xl font-serif text-xl text-navy sm:text-2xl">{appConfig.heroSubtitle}</p>
            <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center md:justify-start [&>a]:sm:whitespace-nowrap">
              <LinkButton href="/ensenanza/" size="lg" variant="gold" icon={<BookOpen className="size-5" aria-hidden />}>
                Recibir una enseñanza
              </LinkButton>
              <LinkButton href="/qr/" size="lg" variant="primary" icon={<QrCode className="size-5" aria-hidden />}>
                Generar código QR
              </LinkButton>
              <LinkButton href="/acerca/" size="lg" variant="secondary" icon={<Info className="size-5" aria-hidden />}>
                Conocer el proyecto
              </LinkButton>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[15rem] sm:max-w-sm md:max-w-md">
            <JesusOpenArms title="Ilustración de Jesús con los brazos abiertos" className="relative w-full drop-shadow-sm" />
            <Dove className="absolute top-4 -right-2 h-16 w-auto motion-safe:animate-float sm:h-20" />
          </div>
        </div>
      </section>

      {/* Propósito */}
      <section className="container-page py-16" aria-labelledby="como-funciona">
        <SectionHeading
          eyebrow="Propósito"
          title={<span id="como-funciona">Evangelizar con un código QR</span>}
          description="Un pequeño código impreso puede abrir una conversación con Dios. Cada vez que alguien lo escanea, recibe una enseñanza diferente centrada en Jesucristo."
        />
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="card flex flex-col gap-3 p-6">
              <span className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-sky text-navy">
                  <s.icon className="size-6" aria-hidden />
                </span>
                <span className="font-serif text-3xl text-gold">{i + 1}</span>
              </span>
              <h3 className="text-xl font-semibold">{s.title}</h3>
              <p className="text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Categorías */}
      <section className="bg-white/60 py-16" aria-labelledby="categorias">
        <div className="container-page">
          <SectionHeading
            eyebrow="Enseñanzas"
            title={<span id="categorias">Temas para conocer a Jesús</span>}
            description="Veinte temas bíblicos con enseñanzas breves, reflexiones originales y oraciones sugeridas."
          />
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/ensenanzas/?categoria=${c.id}`}
                  className="group card flex h-full flex-col gap-2 p-4 transition hover:-translate-y-0.5 hover:border-gold"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-gold-soft text-gold-ink transition group-hover:bg-gold group-hover:text-navy-ink">
                    <CategoryIcon name={c.icon} className="size-5" />
                  </span>
                  <span className="font-bold leading-snug text-navy-ink">{c.name}</span>
                  <span className="hidden text-sm text-muted sm:block">{c.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Mensaje destacado */}
      <section className="container-page py-16" aria-labelledby="destacado">
        <SectionHeading eyebrow="Mensaje destacado" title={<span id="destacado">Una palabra para hoy</span>} />
        <div className="mx-auto mt-8 max-w-4xl">
          <FeaturedTeaching />
        </div>
      </section>

      {/* Participación */}
      <section className="container-page pb-6" aria-labelledby="participa">
        <div className="relative overflow-hidden rounded-[2rem] bg-navy px-6 py-12 text-center text-white sm:px-12">
          <OliveBranch className="pointer-events-none absolute -top-2 -left-6 w-56 opacity-40" />
          <HopePath className="pointer-events-none absolute -right-10 -bottom-10 hidden w-72 rotate-6 rounded-3xl opacity-25 md:block" />
          <HeartHandshake className="mx-auto size-10 text-gold" aria-hidden />
          <h2 id="participa" className="mt-3 text-3xl font-semibold text-white">
            Comparte esperanza con quienes amas
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sky">
            Envía una enseñanza a tu familia, a tus amigos o a alguien que la necesite hoy. Imprime códigos QR y déjalos donde
            puedan iluminar el día de otra persona.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <LinkButton href="/ensenanzas/" size="lg" variant="gold" icon={<Share2 className="size-5" aria-hidden />}>
              Elegir una enseñanza para compartir
            </LinkButton>
            <LinkButton href="/qr/" size="lg" variant="secondary" icon={<QrCode className="size-5" aria-hidden />}>
              Crear tarjetas con QR
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
