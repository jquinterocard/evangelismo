"use client";

import { useId, useRef, useState } from "react";
import { Download, FileJson, FileSpreadsheet, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { applyBackup, createBackup, downloadText, MAX_BACKUP_BYTES, parseBackup, toCsv, type ImportMode } from "@/lib/backup";
import { activitiesStore, goalsStore } from "@/lib/stores";
import { activitiesCsv } from "@/features/activities/ActivityManager";
import { METRIC_LABELS, PERIOD_LABELS } from "@/features/goals/model";

type Pending = { data: Parameters<typeof applyBackup>[0]; summary: string };

export function BackupPanel() {
  const toast = useToast();
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [mode, setMode] = useState<ImportMode>("merge");
  const [error, setError] = useState<string | null>(null);
  const stamp = () => new Date().toISOString().slice(0, 10);

  function exportJson() {
    downloadText(JSON.stringify(createBackup(), null, 2), `respaldo-encuentro-${stamp()}.json`, "application/json");
  }

  function exportGoalsCsv() {
    const goals = goalsStore.read();
    downloadText(
      toCsv(
        ["nombre", "descripcion", "indicador", "periodo", "objetivo", "inicio", "fin"],
        goals.map((g) => [g.name, g.description ?? "", METRIC_LABELS[g.metric], PERIOD_LABELS[g.period], g.target, g.startDate, g.endDate]),
      ),
      `metas-${stamp()}.csv`,
      "text/csv;charset=utf-8",
    );
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setPending(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) return setError("El archivo es demasiado grande (máx. 5 MB).");
    const res = parseBackup(await file.text());
    if (!res.ok) return setError(res.message);
    const c = res.summary.counts;
    setPending({
      data: res.data,
      summary: `${c.activities ?? 0} actividades, ${c.goals ?? 0} metas, ${c.qrHistory ?? 0} códigos QR${c.preferences ? ", preferencias" : ""}${c.learning ? ", progreso de la ruta" : ""}.`,
    });
  }

  function confirmImport() {
    if (!pending) return;
    if (mode === "replace" && !window.confirm("Se reemplazarán los datos actuales de este navegador. ¿Continuar?")) return;
    const r = applyBackup(pending.data, mode);
    if (r.ok) {
      toast("Respaldo importado correctamente.");
      setPending(null);
    } else setError(r.message);
  }

  return (
    <section className="card flex flex-col gap-4 p-5 sm:p-6" aria-labelledby={`${id}-t`}>
      <div>
        <h2 id={`${id}-t`} className="text-xl font-semibold">
          Respaldo de datos
        </h2>
        <p className="mt-1 text-sm text-muted">
          Exporta tus metas, actividades, historial de QR y preferencias para guardarlos o pasarlos a otro dispositivo.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={exportJson} icon={<FileJson className="size-4" aria-hidden />}>
          Exportar JSON
        </Button>
        <Button
          variant="secondary"
          onClick={() => downloadText(activitiesCsv(activitiesStore.read()), `actividades-${stamp()}.csv`, "text/csv;charset=utf-8")}
          icon={<FileSpreadsheet className="size-4" aria-hidden />}
        >
          Actividades CSV
        </Button>
        <Button variant="secondary" onClick={exportGoalsCsv} icon={<FileSpreadsheet className="size-4" aria-hidden />}>
          Metas CSV
        </Button>
        <Button variant="ghost" onClick={() => fileRef.current?.click()} icon={<Upload className="size-4" aria-hidden />}>
          Importar respaldo JSON
        </Button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden onChange={onFile} />
      </div>
      {error && (
        <p role="alert" className="text-sm font-semibold text-rose-ink">
          {error}
        </p>
      )}
      {pending && (
        <div className="rounded-2xl border border-gold bg-gold-soft/60 p-4" role="region" aria-label="Confirmar importación">
          <p className="font-bold text-navy-ink">Respaldo válido: {pending.summary}</p>
          <fieldset className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-6">
            <legend className="sr-only">Modo de importación</legend>
            <label className="flex min-h-11 items-center gap-2">
              <input type="radio" name={`${id}-mode`} className="size-5 accent-navy" checked={mode === "merge"} onChange={() => setMode("merge")} />
              Combinar con los datos actuales
            </label>
            <label className="flex min-h-11 items-center gap-2">
              <input type="radio" name={`${id}-mode`} className="size-5 accent-navy" checked={mode === "replace"} onChange={() => setMode("replace")} />
              Reemplazar los datos actuales
            </label>
          </fieldset>
          <div className="mt-3 flex gap-2">
            <Button onClick={confirmImport} icon={<Download className="size-4" aria-hidden />}>
              Importar
            </Button>
            <Button variant="ghost" onClick={() => setPending(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
