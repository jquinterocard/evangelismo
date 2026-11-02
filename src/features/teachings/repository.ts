/**
 * Acceso al catálogo de enseñanzas.
 * La interfaz permite sustituir en el futuro la fuente local por una API/CRUD real (PostgreSQL)
 * sin modificar los componentes.
 */
import type { CategoryId, Teaching } from "@/types";
import { teachings as localTeachings } from "@/data/teachings";

export interface TeachingRepository {
  all(): Teaching[];
  active(): Teaching[];
  byId(id: string): Teaching | undefined;
  byCategory(category: CategoryId): Teaching[];
  search(query: string, category?: CategoryId | "all"): Teaching[];
}

/** Normaliza para búsqueda sin tildes ni mayúsculas. */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function createLocalTeachingRepository(source: Teaching[]): TeachingRepository {
  const index = new Map(source.map((t) => [t.id, t]));
  const active = () => source.filter((t) => t.active);
  return {
    all: () => source,
    active,
    byId: (id) => index.get(id),
    byCategory: (category) => active().filter((t) => t.category === category),
    search(query, category = "all") {
      const q = normalize(query.slice(0, 100));
      return active().filter((t) => {
        if (category !== "all" && t.category !== category) return false;
        if (!q) return true;
        return normalize(`${t.title} ${t.reference}`).includes(q);
      });
    },
  };
}

export const teachingRepository = createLocalTeachingRepository(localTeachings);
