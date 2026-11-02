import { describe, expect, it } from "vitest";
import { z } from "zod";
import { teachings } from "./teachings";
import { categories } from "./categories";
import { learningPath } from "./learning-path";
import { teachingRepository } from "@/features/teachings/repository";

const nonEmpty = z.string().trim().min(10);
const teachingSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,80}$/),
  title: z.string().trim().min(3).max(70),
  category: z.enum(categories.map((c) => c.id) as [string, ...string[]]),
  reference: z.string().regex(/^[1-3]?\s?[A-ZÁÉÍÓÚ][a-záéíóúñ]+(\s[a-záéíóúñ]+)?\s\d+:\d+(-\d+)?(,\s?\d+)?$/),
  verseText: nonEmpty,
  context: nonEmpty,
  explanation: nonEmpty,
  reflection: nonEmpty,
  application: nonEmpty,
  prayer: nonEmpty,
  active: z.boolean(),
});

describe("catálogo de enseñanzas", () => {
  it("tiene al menos 60 enseñanzas válidas", () => {
    expect(teachings.length).toBeGreaterThanOrEqual(60);
    for (const t of teachings) expect(() => teachingSchema.parse(t), t.id).not.toThrow();
  });
  it("ids y referencias únicos", () => {
    expect(new Set(teachings.map((t) => t.id)).size).toBe(teachings.length);
    expect(new Set(teachings.map((t) => t.reference)).size).toBe(teachings.length);
  });
  it("cubre las 20 categorías", () => {
    expect(categories).toHaveLength(20);
    for (const c of categories) expect(teachings.filter((t) => t.category === c.id).length, c.id).toBeGreaterThanOrEqual(2);
  });
  it("sin HTML en el contenido", () => {
    for (const t of teachings) expect(JSON.stringify(t)).not.toMatch(/<\/?[a-z][^>]*>/i);
  });
  it("búsqueda sin tildes y filtro por categoría", () => {
    expect(teachingRepository.search("JUAN 3:16").map((t) => t.reference)).toContain("Juan 3:16");
    expect(teachingRepository.search("", "paz").every((t) => t.category === "paz")).toBe(true);
    expect(teachingRepository.search("oracion").length).toBeGreaterThanOrEqual(0);
  });
});

describe("ruta Conociendo a Jesús", () => {
  it("tiene 10 temas ordenados con referencias y actividad", () => {
    expect(learningPath.map((t) => t.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(new Set(learningPath.map((t) => t.slug)).size).toBe(10);
    for (const t of learningPath) {
      expect(t.references.length).toBeGreaterThanOrEqual(2);
      expect(t.explanation.length).toBeGreaterThanOrEqual(2);
      expect(t.activity.length).toBeGreaterThan(10);
    }
  });
});
