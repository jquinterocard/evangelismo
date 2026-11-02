import { z } from "zod";
import { ACTIVITY_TYPES, GOAL_METRICS, GOAL_PERIODS } from "@/types";
import { isISODate } from "./dates";
import { UUID_RE } from "./uuid";
import { cleanText } from "./sanitize";

export const LIMITS = {
  name: 80,
  description: 280,
  notes: 500,
  maxQuantity: 100_000,
  maxTarget: 10_000_000,
  maxActivities: 20_000,
  maxGoals: 500,
  maxQrHistory: 2_000,
} as const;

const isoDate = z.string().refine(isISODate, "Fecha inválida (AAAA-MM-DD)");
const isoDateTime = z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Fecha y hora inválida");
const uuid = z.string().regex(UUID_RE, "Identificador inválido");
const text = (max: number) => z.string().transform((s) => cleanText(s, max));
const optionalText = (max: number) =>
  z
    .string()
    .optional()
    .transform((s) => (s === undefined ? undefined : cleanText(s, max) || undefined));

export const activitySchema = z.object({
  id: uuid,
  date: isoDate,
  type: z.enum(ACTIVITY_TYPES),
  quantity: z.number().int().min(1).max(LIMITS.maxQuantity),
  description: optionalText(LIMITS.description),
  notes: optionalText(LIMITS.notes),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

export const goalSchema = z
  .object({
    id: uuid,
    name: text(LIMITS.name).pipe(z.string().min(1, "El nombre es obligatorio")),
    description: optionalText(LIMITS.description),
    metric: z.enum(GOAL_METRICS),
    target: z.number().int().min(1).max(LIMITS.maxTarget),
    period: z.enum(GOAL_PERIODS),
    startDate: isoDate,
    endDate: isoDate,
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
  })
  .refine((g) => g.endDate >= g.startDate, {
    message: "La fecha final debe ser igual o posterior a la inicial",
    path: ["endDate"],
  });

export const qrTemplateSchema = z.enum(["minimal", "cross", "heart", "dove", "bible"]);

export const qrRecordSchema = z.object({
  id: uuid,
  url: z.string().url().max(2048),
  createdAt: isoDateTime,
  template: qrTemplateSchema,
  batchId: uuid.optional(),
});

const hex = z.string().regex(/^#[0-9a-f]{6}$/i);

export const preferencesSchema = z.object({
  publicUrl: z.string().max(2048).optional(),
  qrColor: hex,
  qrBackground: hex,
  qrSize: z.number().int().min(128).max(2048),
  qrMargin: z.number().int().min(0).max(16),
  qrTemplate: qrTemplateSchema,
});

export const learningProgressSchema = z.object({
  completed: z.array(z.string().max(80)).max(100),
});

export const activitiesSchema = z.array(activitySchema).max(LIMITS.maxActivities);
export const goalsSchema = z.array(goalSchema).max(LIMITS.maxGoals);
export const qrHistorySchema = z.array(qrRecordSchema).max(LIMITS.maxQrHistory);
