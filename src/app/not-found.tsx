import { HopePath } from "@/components/illustrations";
import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container-page flex max-w-xl flex-col items-center gap-4 py-20 text-center">
      <HopePath className="w-64" />
      <h1 className="text-3xl font-semibold">No encontramos esta página</h1>
      <p className="text-muted">«Yo soy el camino, la verdad y la vida» (Juan 14:6). Te ayudamos a volver.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <LinkButton href="/">Ir al inicio</LinkButton>
        <LinkButton href="/ensenanza/" variant="secondary">
          Recibir una enseñanza
        </LinkButton>
      </div>
    </div>
  );
}
