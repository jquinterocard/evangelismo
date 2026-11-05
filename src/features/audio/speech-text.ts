/**
 * Texto que se convierte en voz. Lo usan el generador de audio (scripts/gen-audio.mjs,
 * cargado por Node con type-stripping) y el reproductor, así que solo admite imports de tipos.
 */
import type { LearningTopic, Teaching } from "@/types";

export const TEACHING_SECTIONS = [
  { key: "verse", label: "Versículo" },
  { key: "context", label: "Contexto bíblico" },
  { key: "explanation", label: "Explicación" },
  { key: "reflection", label: "Reflexión" },
  { key: "application", label: "Para vivirlo hoy" },
  { key: "prayer", label: "Oración sugerida" },
] as const;

export const TOPIC_SECTIONS = [
  { key: "verse", label: "Textos bíblicos" },
  { key: "explanation", label: "Explicación" },
  { key: "reflection", label: "Reflexión" },
  { key: "application", label: "Actividad" },
] as const;

/** Claves comunes: un tema reutiliza las de la enseñanza para compartir la preferencia. */
export type SectionKey = (typeof TEACHING_SECTIONS)[number]["key"];
export const SECTION_KEYS: readonly SectionKey[] = TEACHING_SECTIONS.map((s) => s.key);

export interface SpeechSection {
  key: SectionKey;
  label: string;
  text: string;
}

const ORDINALS: Record<string, string> = { "1": "Primera de", "2": "Segunda de", "3": "Tercera de" };

/** «1 Juan 4:8-9» → «Primera de Juan, capítulo 4, versículos del 8 al 9». */
export function speakReference(reference: string): string {
  const m = /^\s*(?:([123])\s+)?(.+?)\s+(\d+):(\d+)(?:\s*-\s*(\d+))?\s*$/.exec(reference);
  if (!m) return reference;
  const [, ordinal, book, chapter, from, to] = m;
  const name = ordinal ? `${ORDINALS[ordinal]} ${book}` : book;
  const verses = to ? `versículos del ${from} al ${to}` : `versículo ${from}`;
  return `${name}, capítulo ${chapter}, ${verses}`;
}

/** Ajustes para que la voz lea con naturalidad (guiones de diálogo, comillas, mayúsculas). */
export function normalizeForSpeech(text: string): string {
  return text
    .replace(/\s*—\s*/g, ", ")
    .replace(/^,\s*/, "")
    .replace(/[«»“”"]/g, "")
    .replace(/\bNVI\b/g, "Nueva Versión Internacional")
    .replace(/\b(\p{Lu})(\p{Lu}{2,})\b/gu, (_, a: string, b: string) => a + b.toLowerCase())
    .replace(/,\s*([.,;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

const sentence = (s: string) => {
  const t = normalizeForSpeech(s);
  return /[.!?…]$/.test(t) ? t : `${t}.`;
};
const join = (...parts: string[]) => parts.filter(Boolean).map(sentence).join(" ");

export function teachingSections(t: Teaching): SpeechSection[] {
  const text: Record<SectionKey, string> = {
    verse: join(t.title, t.verseText, speakReference(t.reference)),
    context: join("Contexto bíblico", t.context),
    explanation: join("Explicación", t.explanation),
    reflection: join("Reflexión", t.reflection),
    application: join("Para vivirlo hoy", t.application),
    prayer: join("Oración sugerida", t.prayer),
  };
  return TEACHING_SECTIONS.map((s) => ({ ...s, text: text[s.key] }));
}

export function topicSections(topic: LearningTopic): SpeechSection[] {
  const refs = topic.references.filter((r) => r.text).map((r) => join(r.text!, speakReference(r.reference)));
  const text: Partial<Record<SectionKey, string>> = {
    verse: refs.length ? [sentence(topic.title), ...refs].join(" ") : "",
    explanation: join("Explicación", ...topic.explanation),
    reflection: join("Reflexión", topic.reflection),
    application: topic.activity ? join("Actividad", topic.activity) : "",
  };
  return TOPIC_SECTIONS.map((s) => ({ ...s, text: text[s.key] ?? "" })).filter((s) => s.text);
}

/** Identificador de carpeta de audio: las enseñanzas usan su id; los temas, «tema-<slug>». */
export const topicAudioId = (slug: string) => `tema-${slug}`;
