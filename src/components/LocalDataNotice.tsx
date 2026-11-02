import { HardDrive } from "lucide-react";

export function LocalDataNotice() {
  return (
    <p className="flex items-start gap-3 rounded-2xl border border-sky bg-sky-soft p-4 text-sm text-navy-ink">
      <HardDrive className="mt-0.5 size-5 shrink-0 text-navy" aria-hidden />
      <span>
        <strong>Tus registros se guardan solo en este navegador.</strong> No se envían a ningún servidor ni se sincronizan entre
        dispositivos. Exporta un respaldo de vez en cuando para no perderlos. No registres nombres, teléfonos ni datos personales
        de otras personas.
      </span>
    </p>
  );
}
