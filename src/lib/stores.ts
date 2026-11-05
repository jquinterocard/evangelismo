/** Instancias únicas de los almacenes locales de la aplicación. */
import type { Activity, Goal, LearningProgress, Preferences, QrRecord } from "@/types";
import { createStore } from "./storage";
import {
  activitiesSchema,
  goalsSchema,
  learningProgressSchema,
  LISTEN_SECTIONS,
  listenPreferencesSchema,
  type ListenPreferences,
  preferencesSchema,
  qrHistorySchema,
} from "./schemas";

export const DEFAULT_PREFERENCES: Preferences = {
  qrColor: "#25476A",
  qrBackground: "#FFFFFF",
  qrSize: 512,
  qrMargin: 2,
  qrTemplate: "cross",
};

export const activitiesStore = createStore<Activity[]>({
  key: "activities",
  version: 1,
  schema: activitiesSchema,
  defaultValue: () => [],
});

export const goalsStore = createStore<Goal[]>({
  key: "goals",
  version: 1,
  schema: goalsSchema,
  defaultValue: () => [],
});

export const preferencesStore = createStore<Preferences>({
  key: "preferences",
  version: 1,
  schema: preferencesSchema,
  defaultValue: () => ({ ...DEFAULT_PREFERENCES }),
});

export const DEFAULT_LISTEN_PREFERENCES: ListenPreferences = { voice: "f", rate: 1, sections: [...LISTEN_SECTIONS] };

/** Preferencias de la narración (voz, velocidad y secciones a escuchar). */
export const listenPreferencesStore = createStore<ListenPreferences>({
  key: "listen",
  version: 1,
  schema: listenPreferencesSchema,
  defaultValue: () => ({ ...DEFAULT_LISTEN_PREFERENCES, sections: [...DEFAULT_LISTEN_PREFERENCES.sections] }),
});

export const qrHistoryStore = createStore<QrRecord[]>({
  key: "qr-history",
  version: 1,
  schema: qrHistorySchema,
  defaultValue: () => [],
});

export const learningStore = createStore<LearningProgress>({
  key: "learning",
  version: 1,
  schema: learningProgressSchema,
  defaultValue: () => ({ completed: [] }),
});

export const allStores = {
  activities: activitiesStore,
  goals: goalsStore,
  preferences: preferencesStore,
  qrHistory: qrHistoryStore,
  learning: learningStore,
} as const;
