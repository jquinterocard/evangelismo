import type { Category, CategoryId } from "@/types";

export const categories: Category[] = [
  { id: "amor-de-dios", name: "El amor de Dios", description: "Un amor que nos buscó primero y nunca se rinde.", icon: "Heart", illustration: "heart" },
  { id: "salvacion", name: "La salvación en Jesucristo", description: "El regalo de vida nueva por medio de Jesús.", icon: "Cross", illustration: "cross" },
  { id: "perdon", name: "El perdón", description: "Libertad para empezar de nuevo y perdonar a otros.", icon: "HandHeart", illustration: "hands" },
  { id: "fe", name: "La fe", description: "Confiar en Dios aun cuando no lo vemos todo.", icon: "Sparkles", illustration: "light" },
  { id: "esperanza", name: "La esperanza", description: "Una luz firme en medio de cualquier noche.", icon: "Sunrise", illustration: "path" },
  { id: "oracion", name: "La oración", description: "Hablar con Dios como un hijo habla con su Padre.", icon: "MessageCircleHeart", illustration: "hands" },
  { id: "paz", name: "La paz", description: "La paz que Jesús da y que el mundo no puede quitar.", icon: "Feather", illustration: "dove" },
  { id: "gracia", name: "La gracia", description: "Favor inmerecido que transforma la vida.", icon: "Gift", illustration: "light" },
  { id: "arrepentimiento", name: "El arrepentimiento", description: "Volver el corazón a Dios.", icon: "Undo2", illustration: "path" },
  { id: "proposito", name: "El propósito de la vida", description: "Fuimos creados para conocer a Dios y amar.", icon: "Compass", illustration: "path" },
  { id: "milagros", name: "Los milagros de Jesús", description: "Señales del poder y la compasión de Jesús.", icon: "Wand2", illustration: "light" },
  { id: "parabolas", name: "Las parábolas de Jesús", description: "Historias sencillas con verdades profundas.", icon: "BookOpen", illustration: "seed" },
  { id: "vida-eterna", name: "La vida eterna", description: "Una esperanza que va más allá de esta vida.", icon: "Infinity", illustration: "light" },
  { id: "misericordia", name: "La misericordia", description: "Dios se compadece y nos llama a hacer lo mismo.", icon: "HeartHandshake", illustration: "heart" },
  { id: "confianza", name: "La confianza en Dios", description: "Descansar en su cuidado en cada circunstancia.", icon: "Anchor", illustration: "olive" },
  { id: "espiritu-santo", name: "El Espíritu Santo", description: "Dios con nosotros, guía y consolador.", icon: "Flame", illustration: "dove" },
  { id: "obediencia", name: "La obediencia", description: "Seguir a Jesús con amor y confianza.", icon: "Footprints", illustration: "path" },
  { id: "humildad", name: "La humildad", description: "Aprender del corazón manso de Jesús.", icon: "Sprout", illustration: "seed" },
  { id: "servicio", name: "El servicio", description: "Jesús vino a servir y nos invita a servir.", icon: "HandHelping", illustration: "hands" },
  { id: "amor-al-projimo", name: "El amor al prójimo", description: "Amar a otros como Jesús nos amó.", icon: "Users", illustration: "heart" },
];

export const categoryById: Record<CategoryId, Category> = Object.fromEntries(
  categories.map((c) => [c.id, c]),
) as Record<CategoryId, Category>;

export function getCategory(id: CategoryId): Category {
  return categoryById[id];
}
