import type { QrRecord, QrTemplateId } from "@/types";
import { LIMITS } from "@/lib/schemas";
import { qrHistoryStore } from "@/lib/stores";
import { generateUuid } from "@/lib/uuid";
import { buildQrUrl } from "@/lib/urls";

export function createQrRecords(publicBase: string, count: number, template: QrTemplateId, now = new Date()): QrRecord[] {
  const n = Math.max(1, Math.min(100, Math.floor(count)));
  const batchId = n > 1 ? generateUuid() : undefined;
  const createdAt = now.toISOString();
  return Array.from({ length: n }, () => {
    const id = generateUuid();
    return { id, url: buildQrUrl(publicBase, id), createdAt, template, ...(batchId ? { batchId } : {}) };
  });
}

/** Guarda en el historial local (los más recientes primero, con tope). */
export function saveQrRecords(records: QrRecord[]) {
  return qrHistoryStore.update((prev) => [...[...records].reverse(), ...prev].slice(0, LIMITS.maxQrHistory));
}
