export type CategoryId =
  | "amor-de-dios"
  | "salvacion"
  | "perdon"
  | "fe"
  | "esperanza"
  | "oracion"
  | "paz"
  | "gracia"
  | "arrepentimiento"
  | "proposito"
  | "milagros"
  | "parabolas"
  | "vida-eterna"
  | "misericordia"
  | "confianza"
  | "espiritu-santo"
  | "obediencia"
  | "humildad"
  | "servicio"
  | "amor-al-projimo";

export type IllustrationKey =
  | "jesus"
  | "dove"
  | "bible"
  | "cross"
  | "heart"
  | "hands"
  | "olive"
  | "path"
  | "seed"
  | "light";

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  /** Nombre del icono de lucide-react. */
  icon: string;
  illustration: IllustrationKey;
}

export interface Teaching {
  id: string;
  title: string;
  category: CategoryId;
  /** Referencia bíblica verificable, p. ej. "Juan 3:16". */
  reference: string;
  /** Texto bíblico NVI (citado con permiso general de Biblica; revisar antes de publicar). */
  verseText: string;
  context: string;
  explanation: string;
  reflection: string;
  application: string;
  prayer: string;
  illustration?: IllustrationKey;
  active: boolean;
}

export const ACTIVITY_TYPES = [
  "qr_shared",
  "teaching_shared",
  "visit_reported",
  "interested_reported",
  "faith_decision_reported",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface Activity {
  id: string;
  /** Fecha local YYYY-MM-DD. */
  date: string;
  type: ActivityType;
  quantity: number;
  description?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Indicadores locales (actividades + QR generados) y globales (Supabase). */
export const GOAL_METRICS = [
  ...ACTIVITY_TYPES,
  "qr_generated",
  "global_completions",
  "global_positive",
  "global_participation",
] as const;
export type GoalMetric = (typeof GOAL_METRICS)[number];

export const GOAL_PERIODS = ["daily", "weekly", "monthly", "quarterly", "yearly", "custom"] as const;
export type GoalPeriod = (typeof GOAL_PERIODS)[number];

export interface Goal {
  id: string;
  name: string;
  description?: string;
  metric: GoalMetric;
  target: number;
  period: GoalPeriod;
  /** YYYY-MM-DD inclusive. */
  startDate: string;
  /** YYYY-MM-DD inclusive. */
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export type GoalStatus = "upcoming" | "active" | "achieved" | "ended";

export interface QrRecord {
  id: string;
  url: string;
  createdAt: string;
  template: QrTemplateId;
  batchId?: string;
}

export type QrTemplateId = "minimal" | "cross" | "heart" | "dove" | "bible";

export interface Preferences {
  publicUrl?: string;
  qrColor: string;
  qrBackground: string;
  qrSize: number;
  qrMargin: number;
  qrTemplate: QrTemplateId;
}

export interface LearningProgress {
  /** slugs de temas marcados como leídos. */
  completed: string[];
}

export interface BibleReference {
  /** Referencia verificable, p. ej. "Juan 14:6". */
  reference: string;
  /** Texto NVI breve (opcional). */
  text?: string;
}

export interface LearningTopic {
  /** slug estable usado en la URL. */
  slug: string;
  order: number;
  title: string;
  summary: string;
  references: BibleReference[];
  /** Explicación sencilla, en párrafos. */
  explanation: string[];
  reflection: string;
  /** Actividad práctica opcional. */
  activity: string;
  illustration: IllustrationKey;
}
