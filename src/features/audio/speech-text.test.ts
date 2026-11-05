import { describe, expect, it } from "vitest";
import { teachings } from "@/data/teachings";
import { learningPath } from "@/data/learning-path";
import { normalizeForSpeech, speakReference, teachingSections, topicSections } from "./speech-text";

describe("speakReference", () => {
  it.each([
    ["Juan 3:16", "Juan, capítulo 3, versículo 16"],
    ["Mateo 16:15-16", "Mateo, capítulo 16, versículos del 15 al 16"],
    ["1 Juan 4:8", "Primera de Juan, capítulo 4, versículo 8"],
    ["2 Corintios 12:9", "Segunda de Corintios, capítulo 12, versículo 9"],
    ["Salmo 119:105", "Salmo, capítulo 119, versículo 105"],
  ])("%s", (ref, spoken) => expect(speakReference(ref)).toBe(spoken));

  it("devuelve la referencia sin cambios si no la reconoce", () => {
    expect(speakReference("Salmos")).toBe("Salmos");
  });

  it("entiende todas las referencias del catálogo", () => {
    const refs = [...teachings.map((t) => t.reference), ...learningPath.flatMap((t) => t.references.map((r) => r.reference))];
    for (const r of refs) expect(speakReference(r), r).toMatch(/capítulo \d+, versículos? /);
  });
});

describe("normalizeForSpeech", () => {
  it("convierte guiones de diálogo en pausas y quita comillas", () => {
    expect(normalizeForSpeech("—Yo soy el camino —le contestó Jesús—. «Nadie» llega")).toBe("Yo soy el camino, le contestó Jesús. Nadie llega");
  });
  it("evita que lea letra por letra palabras en mayúsculas", () => {
    expect(normalizeForSpeech("El SEÑOR es mi pastor (NVI)")).toBe("El Señor es mi pastor (Nueva Versión Internacional)");
  });
});

describe("secciones", () => {
  it("una enseñanza tiene las seis secciones con encabezado hablado", () => {
    const s = teachingSections(teachings[0]);
    expect(s.map((x) => x.key)).toEqual(["verse", "context", "explanation", "reflection", "application", "prayer"]);
    expect(s[0].text).toContain(teachings[0].title);
    expect(s[0].text).toMatch(/Juan, capítulo 3, versículo 16\.$/);
    expect(s[1].text.startsWith("Contexto bíblico. ")).toBe(true);
  });
  it("un tema lee solo las citas con texto", () => {
    const s = topicSections(learningPath[0]);
    expect(s[0].key).toBe("verse");
    expect(s[0].text).toContain("Juan, capítulo 14, versículo 6");
    expect(s[0].text).not.toContain("Colosenses");
  });
});
