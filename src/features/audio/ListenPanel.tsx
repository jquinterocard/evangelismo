"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Headphones, Pause, Play, Settings2, SkipBack, SkipForward } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { listenPreferencesStore } from "@/lib/stores";
import { LISTEN_RATES, LISTEN_SECTIONS, type ListenPreferences } from "@/lib/schemas";
import { audioUrl, useAudioManifest, type AudioTrack, type VoiceKey } from "./manifest";
import type { SectionKey } from "./speech-text";

interface SectionInfo {
  key: SectionKey;
  label: string;
}

interface Props {
  /** Carpeta del audio: id de la enseñanza o «tema-<slug>». */
  audioId: string;
  /** Título que se muestra en la pantalla de bloqueo del celular. */
  title: string;
  /** Secciones en orden de lectura. */
  sections: readonly SectionInfo[];
  /** «compact»: un solo botón que lee solo el versículo (tarjeta de inicio). */
  variant?: "full" | "compact";
}

type Status = "idle" | "loading" | "playing" | "paused";

const fmt = (s: number) => {
  const t = Math.max(0, Math.round(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};
const rateLabel = (r: number) => `${String(r).replace(".", ",")}×`;
const setPrefs = (fn: (p: ListenPreferences) => ListenPreferences) => listenPreferencesStore.update(fn);

/** Reproductor de la narración pregenerada con Piper (public/audio). */
export function ListenPanel({ audioId, title, sections, variant = "full" }: Props) {
  const manifest = useAudioManifest();
  const prefs = useStore(listenPreferencesStore);
  const audioRef = useRef<HTMLAudioElement>(null);
  const autoplay = useRef(false);
  const pendingSeek = useRef<number | null>(null);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [time, setTime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const settingsId = useId();

  const byVoice = manifest?.items[audioId];
  const availableVoices = (["f", "m"] as const).filter((v) => byVoice?.[v] && Object.keys(byVoice[v]!).length);
  const voice: VoiceKey | undefined = availableVoices.includes(prefs.voice) ? prefs.voice : availableVoices[0];
  const tracks = voice ? byVoice?.[voice] : undefined;

  const available = useMemo(() => sections.filter((s) => tracks?.[s.key]), [sections, tracks]);
  const queue = useMemo(() => {
    if (variant === "compact") return available.filter((s) => s.key === "verse");
    const chosen = available.filter((s) => prefs.sections.includes(s.key));
    return chosen.length ? chosen : available;
  }, [available, prefs.sections, variant]);

  const current = queue[Math.min(index, queue.length - 1)];
  const track: AudioTrack | undefined = current && tracks?.[current.key];
  const src = track && voice && current ? audioUrl(audioId, voice, current.key, track) : undefined;
  const durations = queue.map((s) => tracks?.[s.key]?.d ?? 0);
  const total = durations.reduce((a, b) => a + b, 0);
  const elapsed = durations.slice(0, index).reduce((a, b) => a + b, 0) + time;
  const active = status === "playing" || status === "loading";

  // Si cambia la cola (secciones elegidas) y el índice queda fuera, se vuelve al inicio.
  if (index > 0 && index >= queue.length) {
    setIndex(0);
    setTime(0);
  }

  // Al cambiar de pista (siguiente sección o cambio de voz) se continúa reproduciendo.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;
    audio.defaultPlaybackRate = prefs.rate;
    audio.playbackRate = prefs.rate;
    if (autoplay.current) audio.play().catch(() => setStatus("paused"));
    // prefs.rate se aplica en el efecto de abajo; aquí solo importa el cambio de pista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.defaultPlaybackRate = prefs.rate;
    audio.playbackRate = prefs.rate;
    audio.preservesPitch = true;
  }, [prefs.rate]);

  // Resalta en la página la sección que se está escuchando.
  useEffect(() => {
    if (variant !== "full" || !current || !active) return;
    const el = document.getElementById(`listen-${current.key}`);
    if (!el) return;
    el.dataset.listening = "true";
    return () => {
      delete el.dataset.listening;
    };
  }, [current, active, variant]);

  // Controles en la pantalla de bloqueo / notificación del celular.
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
    const ms = navigator.mediaSession;
    ms.metadata = new MediaMetadata({ title: `${title} · ${current?.label ?? ""}`, artist: "Un Encuentro con Jesús" });
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => void audioRef.current?.play()],
      ["pause", () => audioRef.current?.pause()],
      ["previoustrack", () => goTo(index - 1)],
      ["nexttrack", () => goTo(index + 1)],
    ];
    for (const [a, h] of handlers) {
      try {
        ms.setActionHandler(a, h);
      } catch {
        /* acción no soportada */
      }
    }
    return () => {
      for (const [a] of handlers) {
        try {
          ms.setActionHandler(a, null);
        } catch {
          /* acción no soportada */
        }
      }
    };
  });

  if (!queue.length || !voice) return null;

  function goTo(i: number, play = true) {
    if (i < 0 || i >= queue.length) return;
    autoplay.current = play;
    pendingSeek.current = null;
    setTime(0);
    if (i === index) {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        if (play) audio.play().catch(() => setStatus("paused"));
      }
    } else {
      setIndex(i);
      setStatus(play ? "loading" : "paused");
    }
  }

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (active) {
      autoplay.current = false;
      audio.pause();
    } else {
      autoplay.current = true;
      setStatus("loading");
      audio.play().catch(() => setStatus("paused"));
    }
  }

  function changeVoice(v: VoiceKey) {
    if (v === voice) return;
    // Conserva la posición aproximada dentro de la sección actual.
    const audio = audioRef.current;
    const newTrack = current && byVoice?.[v]?.[current.key];
    if (audio && track && newTrack && audio.currentTime > 0) pendingSeek.current = (audio.currentTime / track.d) * newTrack.d;
    autoplay.current = active;
    setPrefs((p) => ({ ...p, voice: v }));
  }

  function seekTo(seconds: number) {
    let rest = Math.max(0, Math.min(seconds, total - 0.1));
    let i = 0;
    while (i < durations.length - 1 && rest >= durations[i]) rest -= durations[i++];
    autoplay.current = active;
    if (i === index && audioRef.current) {
      audioRef.current.currentTime = rest;
      setTime(rest);
    } else {
      pendingSeek.current = rest;
      setTime(rest);
      setIndex(i);
    }
  }

  function toggleSection(key: SectionKey) {
    setPrefs((p) => {
      const has = p.sections.includes(key);
      if (has && p.sections.length === 1) return p; // siempre queda al menos una
      const next = has ? p.sections.filter((k) => k !== key) : [...p.sections, key];
      return { ...p, sections: LISTEN_SECTIONS.filter((k) => next.includes(k)) };
    });
  }

  const audio = (
    <audio
      ref={audioRef}
      src={src}
      preload="none"
      onPlay={() => setStatus("loading")}
      onPlaying={() => setStatus("playing")}
      onWaiting={() => setStatus("loading")}
      onPause={() => setStatus((s) => (s === "idle" ? s : "paused"))}
      onLoadedMetadata={(e) => {
        const a = e.currentTarget;
        a.playbackRate = prefs.rate;
        if (pendingSeek.current != null) {
          a.currentTime = pendingSeek.current;
          pendingSeek.current = null;
        }
      }}
      onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
      onEnded={() => {
        if (index + 1 < queue.length) goTo(index + 1);
        else {
          autoplay.current = false;
          setIndex(0);
          setTime(0);
          setStatus("idle");
        }
      }}
      onError={() => {
        autoplay.current = false;
        setStatus("idle");
      }}
    />
  );

  if (variant === "compact") {
    return (
      <>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={active}
          className="inline-flex min-h-12 items-center gap-2 rounded-full px-4 font-bold text-navy hover:bg-sky-soft"
        >
          {active ? <Pause className="size-5" aria-hidden /> : <Headphones className="size-5" aria-hidden />}
          {active ? "Pausar" : "Escuchar versículo"}
        </button>
        {audio}
      </>
    );
  }

  const voices = manifest?.voices ?? {};
  return (
    <section aria-label="Escuchar esta enseñanza" className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-soft)] sm:p-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-navy text-white shadow-[var(--shadow-soft)] transition hover:bg-navy-deep active:scale-95"
          aria-label={active ? "Pausar" : status === "paused" ? "Continuar escuchando" : "Escuchar"}
        >
          {active ? <Pause className="size-6" aria-hidden /> : <Play className="size-6 translate-x-0.5" aria-hidden />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-bold text-gold-ink">
            <Headphones className="size-4" aria-hidden /> Escuchar
          </p>
          <p className="truncate font-semibold text-ink" aria-live="polite">
            {current?.label}
            {queue.length > 1 && (
              <span className="font-normal text-muted">
                {" "}
                · {index + 1} de {queue.length}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => goTo(index - 1, active)}
            disabled={index === 0}
            className="inline-flex size-11 items-center justify-center rounded-full text-navy hover:bg-sky-soft disabled:opacity-40"
            aria-label="Sección anterior"
          >
            <SkipBack className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1, active)}
            disabled={index >= queue.length - 1}
            className="inline-flex size-11 items-center justify-center rounded-full text-navy hover:bg-sky-soft disabled:opacity-40"
            aria-label="Sección siguiente"
          >
            <SkipForward className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setShowSettings((s) => !s)}
            aria-expanded={showSettings}
            aria-controls={settingsId}
            className="inline-flex size-11 items-center justify-center rounded-full text-navy hover:bg-sky-soft aria-expanded:bg-sky-soft"
            aria-label="Ajustes de voz"
          >
            <Settings2 className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 text-sm text-muted tabular-nums">
        <span>{fmt(elapsed / prefs.rate)}</span>
        <input
          type="range"
          min={0}
          max={Math.max(1, Math.floor(total))}
          step={1}
          value={Math.min(Math.floor(elapsed), Math.floor(total))}
          onChange={(e) => seekTo(Number(e.target.value))}
          aria-label="Posición"
          aria-valuetext={`${fmt(elapsed)} de ${fmt(total)}`}
          className="h-2 flex-1 cursor-pointer accent-[var(--color-navy)]"
        />
        <span>{fmt(total / prefs.rate)}</span>
      </div>

      {showSettings && (
        <div id={settingsId} className="mt-4 grid gap-4 border-t border-line pt-4">
          {availableVoices.length > 1 && (
            <fieldset>
              <legend className="mb-2 text-sm font-bold text-ink">Voz</legend>
              <div className="flex flex-wrap gap-2">
                {availableVoices.map((v) => (
                  <Chip key={v} pressed={v === voice} onClick={() => changeVoice(v)}>
                    {voices[v]?.label ?? v}
                  </Chip>
                ))}
              </div>
            </fieldset>
          )}
          <fieldset>
            <legend className="mb-2 text-sm font-bold text-ink">Velocidad</legend>
            <div className="flex flex-wrap gap-2">
              {LISTEN_RATES.map((r) => (
                <Chip key={r} pressed={r === prefs.rate} onClick={() => setPrefs((p) => ({ ...p, rate: r }))}>
                  {rateLabel(r)}
                </Chip>
              ))}
            </div>
          </fieldset>
          {available.length > 1 && (
            <fieldset>
              <legend className="mb-2 text-sm font-bold text-ink">Qué escuchar</legend>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {available.map((s) => (
                  <label key={s.key} className="inline-flex min-h-10 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      className="size-5 accent-[var(--color-navy)]"
                      checked={queue.some((q) => q.key === s.key)}
                      onChange={() => toggleSection(s.key)}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Chip pressed={false} onClick={() => setPrefs((p) => ({ ...p, sections: ["verse"] }))}>
                  Solo el versículo
                </Chip>
                <Chip pressed={false} onClick={() => setPrefs((p) => ({ ...p, sections: [...LISTEN_SECTIONS] }))}>
                  Todo
                </Chip>
              </div>
            </fieldset>
          )}
          <p className="text-xs text-muted">Voz generada con Piper, un sintetizador de voz libre. Tus ajustes se guardan en este dispositivo.</p>
        </div>
      )}
      {audio}
    </section>
  );
}

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-10 rounded-full border px-4 text-sm font-bold transition ${
        pressed ? "border-navy bg-navy text-white" : "border-navy/25 bg-surface text-navy hover:border-navy hover:bg-sky-soft"
      }`}
    >
      {children}
    </button>
  );
}
