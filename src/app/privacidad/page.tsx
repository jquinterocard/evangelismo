import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { appConfig } from "@/lib/config";

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
            <li>Si decides escribirnos por WhatsApp, esa conversación ocurre en WhatsApp y no se guarda en este sitio.</li>
            <li>No usamos cookies de seguimiento ni herramientas de analítica.</li>
            <li>
              Si el sitio tiene activado el registro global, la pregunta opcional al final de cada enseñanza guarda solo: el
              identificador de la enseñanza, el identificador del código QR (si llegaste por uno), la fecha, tu respuesta voluntaria y un
              identificador aleatorio de sesión que se borra al cerrar la pestaña. No guardamos direcciones IP ni creamos perfiles.
            </li>
            <li>Completar una enseñanza o responder la pregunta no implica ningún compromiso religioso.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Si pides que te contactemos</h2>
          <p className="mt-2">
            Solo si tú lo eliges, después de responder «Sí» a una enseñanza, puedes dejarnos tus datos para que alguien del equipo de «
            {appConfig.name}» te contacte. Esto es completamente voluntario y requiere tu autorización expresa (Ley 1581 de 2012 de
            protección de datos personales).
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <strong>Qué guardamos:</strong> tu nombre, tu número de WhatsApp, tu correo (si lo das), cómo prefieres que te contactemos,
              tu petición de oración (si la escribes), la enseñanza que leíste y la fecha de tu autorización. Para evitar abusos, durante 24
              horas guardamos también un código derivado de tu conexión con una clave aleatoria que se descarta al día siguiente (no
              guardamos tu dirección IP), y luego se borra.
            </li>
            <li>
              <strong>Para qué:</strong> únicamente para contactarte, orar por ti y acompañarte si así lo deseas. No vendemos ni
              compartimos tus datos, y no los usamos para publicidad.
            </li>
            <li>
              <strong>Quién los ve:</strong> solo los mentores autorizados del equipo, que entran a un panel privado con su correo.
            </li>
            <li>
              <strong>Cuánto tiempo:</strong> mientras dure el acompañamiento. Puedes pedir que los borremos en cualquier momento y lo
              haremos.
            </li>
            <li>
              <strong>Tus derechos:</strong> puedes conocer, actualizar, rectificar o suprimir tus datos, y revocar tu autorización,
              escribiéndole a la persona que te contactó o respondiendo a su mensaje.
            </li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Para quien comparte</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Metas, actividades, preferencias e historial de QR se guardan solo en el almacenamiento local de tu navegador.</li>
            <li>No se sincronizan entre dispositivos.</li>
            <li>Por favor, no registres nombres, teléfonos ni información sensible de otras personas.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Servicios externos</h2>
          <p className="mt-2">
            El enlace «Leer el pasaje completo» abre BibleGateway en una pestaña nueva, con sus propias políticas. El registro global, cuando está
            activado, usa Supabase como base de datos (también para las solicitudes de contacto). El botón «Escribir por WhatsApp» abre WhatsApp, con sus propias políticas.
          </p>
        </section>
      </div>
    </>
  );
}
