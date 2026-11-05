"use client";

import { useSyncExternalStore } from "react";
import { withBasePath } from "@/lib/config";
import type { SectionKey } from "./speech-text";

/** Formato de public/audio/manifest.json (lo escribe scripts/gen-audio.mjs). */
export type VoiceKey = "f" | "m";
export interface AudioTrack {
  /** Duración en segundos. */
  d: number;
  /** Hash del contenido, para invalidar cachés cuando cambia el texto. */
  h: string;
}
export interface AudioManifest {
  version: 1;
  voices: Partial<Record<VoiceKey, { label: string; name: string }>>;
  items: Record<string, Partial<Record<VoiceKey, Partial<Record<SectionKey, AudioTrack>>>>>;
}

/** undefined = cargando; null = no hay narración publicada. */
type State = AudioManifest | null | undefined;

let state: State;
let started = false;
const listeners = new Set<() => void>();

function isManifest(x: unknown): x is AudioManifest {
  return !!x && typeof x === "object" && (x as AudioManifest).version === 1 && typeof (x as AudioManifest).items === "object";
}

function load() {
  if (started) return;
  started = true;
  fetch(withBasePath("/audio/manifest.json"))
    .then((r) => (r.ok ? r.json() : null))
    .then((json: unknown) => (isManifest(json) ? json : null))
    .catch(() => null)
    .then((m) => {
      state = m;
      listeners.forEach((l) => l());
    });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  load();
  return () => listeners.delete(listener);
}

export function useAudioManifest(): State {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => undefined,
  );
}

export function audioUrl(itemId: string, voice: VoiceKey, section: SectionKey, track: AudioTrack): string {
  return withBasePath(`/audio/${voice}/${encodeURIComponent(itemId)}/${section}.mp3?v=${track.h}`);
}

/** Solo para pruebas. */
export function __resetAudioManifest() {
  state = undefined;
  started = false;
  listeners.clear();
}
