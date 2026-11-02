import type { Teaching } from "@/types";
import { teachingsGroup1 } from "./group-1";
import { teachingsGroup2 } from "./group-2";
import { teachingsGroup3 } from "./group-3";
import { teachingsGroup4 } from "./group-4";

/**
 * Catálogo inicial de enseñanzas. Para editarlo, modifica los archivos group-*.ts.
 * Para desactivar una enseñanza sin borrarla, cambia `active` a false.
 */
export const teachings: Teaching[] = [...teachingsGroup1, ...teachingsGroup2, ...teachingsGroup3, ...teachingsGroup4];
