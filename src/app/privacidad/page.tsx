import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Privacidad", description: "Qué datos usa la aplicación y dónde se guardan." };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Privacidad" title="Tu privacidad importa" illustration="olive" />
      <div className="container-page flex max-w-3xl flex-col gap-6 py-10">
        <section>
          <h2 className="text-xl font-semibold">Para quien lee las enseñanzas</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>No pedimos nombre, correo, teléfono ni ningún dato personal para leer.</li>
            <li>No usamos cookies de seguimiento ni herramientas de analítica.</li>
            <li>
              Si el sitio tiene activado el registro global, el botón «He completado esta enseñanza» y la pregunta opcional guardan solo: el
              identificador de la enseñanza, el identificador del código QR (si llegaste por uno), la fecha, tu respuesta voluntaria y un
              identificador aleatorio de sesión que se borra al cerrar la pestaña. No guardamos direcciones IP ni creamos perfiles.
            </li>
            <li>Completar una enseñanza o responder la pregunta no implica ningún compromiso religioso.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Para quien comparte</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Metas, actividades, preferencias e historial de QR se guardan solo en el almacenamiento local de tu navegador.</li>
            <li>No se sincronizan entre dispositivos. Usa la exportación JSON para respaldarlos.</li>
            <li>Por favor, no registres nombres, teléfonos ni información sensible de otras personas.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Servicios externos</h2>
          <p className="mt-2">
            El enlace «Leer el pasaje completo» abre BibleGateway en una pestaña nueva, con sus propias políticas. El registro global, cuando está
            activado, usa Supabase como base de datos.
          </p>
        </section>
      </div>
    </>
  );
}
