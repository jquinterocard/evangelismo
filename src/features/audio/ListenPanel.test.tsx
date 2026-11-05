import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { listenPreferencesStore } from "@/lib/stores";
import { ListenPanel } from "./ListenPanel";
import { __resetAudioManifest, type AudioManifest } from "./manifest";
import { TEACHING_SECTIONS } from "./speech-text";

const track = (d: number) => ({ d, h: "abc" });
const manifest: AudioManifest = {
  version: 1,
  voices: { f: { label: "Femenina", name: "f" }, m: { label: "Masculina", name: "m" } },
  items: {
    t1: {
      f: { verse: track(10), context: track(20), prayer: track(5) },
      m: { verse: track(12), context: track(18), prayer: track(6) },
    },
  },
};

function mockFetch(body: unknown, ok = true) {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok, json: async () => body })));
}

const audio = () => document.querySelector("audio")!;

beforeEach(() => {
  __resetAudioManifest();
  listenPreferencesStore.clear();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(async function (this: HTMLMediaElement) {
    this.dispatchEvent(new Event("play"));
    this.dispatchEvent(new Event("playing"));
  });
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (this: HTMLMediaElement) {
    this.dispatchEvent(new Event("pause"));
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ListenPanel", () => {
  it("no se muestra si no hay narración publicada", async () => {
    mockFetch(null, false);
    const { container } = render(<ListenPanel audioId="t1" title="T" sections={TEACHING_SECTIONS} />);
    await act(async () => {});
    expect(container).toBeEmptyDOMElement();
  });

  it("no se muestra si el ítem no tiene audio", async () => {
    mockFetch(manifest);
    const { container } = render(<ListenPanel audioId="otro" title="T" sections={TEACHING_SECTIONS} />);
    await act(async () => {});
    expect(container).toBeEmptyDOMElement();
  });

  it("reproduce las secciones disponibles en orden y pasa a la siguiente al terminar", async () => {
    mockFetch(manifest);
    render(<ListenPanel audioId="t1" title="T" sections={TEACHING_SECTIONS} />);
    const play = await screen.findByRole("button", { name: "Escuchar" });
    expect(screen.getByText(/1 de 3/)).toBeInTheDocument();
    expect(audio().getAttribute("src")).toBe("/audio/f/t1/verse.mp3?v=abc");

    await userEvent.click(play);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Pausar" })).toBeInTheDocument();

    act(() => void audio().dispatchEvent(new Event("ended")));
    expect(audio().getAttribute("src")).toBe("/audio/f/t1/context.mp3?v=abc");
    expect(screen.getByText(/2 de 3/)).toBeInTheDocument();
  });

  it("guarda voz, velocidad y secciones elegidas", async () => {
    mockFetch(manifest);
    render(<ListenPanel audioId="t1" title="T" sections={TEACHING_SECTIONS} />);
    await userEvent.click(await screen.findByRole("button", { name: "Ajustes de voz" }));

    await userEvent.click(screen.getByRole("button", { name: "Masculina" }));
    expect(listenPreferencesStore.read().voice).toBe("m");
    expect(audio().getAttribute("src")).toBe("/audio/m/t1/verse.mp3?v=abc");

    await userEvent.click(screen.getByRole("button", { name: "1,25×" }));
    expect(listenPreferencesStore.read().rate).toBe(1.25);
    expect(audio().playbackRate).toBe(1.25);

    await userEvent.click(screen.getByRole("checkbox", { name: "Versículo" }));
    expect(listenPreferencesStore.read().sections).not.toContain("verse");
    expect(audio().getAttribute("src")).toBe("/audio/m/t1/context.mp3?v=abc");

    await userEvent.click(screen.getByRole("button", { name: "Solo el versículo" }));
    expect(listenPreferencesStore.read().sections).toEqual(["verse"]);
    expect(screen.queryByText(/de 3/)).not.toBeInTheDocument();
  });

  it("no permite desmarcar la última sección", async () => {
    mockFetch(manifest);
    listenPreferencesStore.write({ voice: "f", rate: 1, sections: ["prayer"] });
    render(<ListenPanel audioId="t1" title="T" sections={TEACHING_SECTIONS} />);
    await userEvent.click(await screen.findByRole("button", { name: "Ajustes de voz" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Oración sugerida" }));
    expect(listenPreferencesStore.read().sections).toEqual(["prayer"]);
  });

  it("la variante compacta lee solo el versículo", async () => {
    mockFetch(manifest);
    render(<ListenPanel variant="compact" audioId="t1" title="T" sections={TEACHING_SECTIONS} />);
    await userEvent.click(await screen.findByRole("button", { name: /Escuchar versículo/ }));
    expect(audio().getAttribute("src")).toBe("/audio/f/t1/verse.mp3?v=abc");
    act(() => void audio().dispatchEvent(new Event("ended")));
    expect(audio().getAttribute("src")).toBe("/audio/f/t1/verse.mp3?v=abc");
    expect(screen.getByRole("button", { name: /Escuchar versículo/ })).toBeInTheDocument();
  });
});
