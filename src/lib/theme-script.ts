/** Constantes de tema y script previo a la hidratación (sin dependencias de React). */
export type Theme = "light" | "dark";
export const THEME_KEY = "uecj:theme";
export const THEME_COLORS: Record<Theme, string> = { light: "#25476A", dark: "#0E1824" };

/** Aplica el modo guardado (o el del sistema) antes de pintar, para evitar destellos. */
export const themePreloadScript = `try{var s=localStorage.getItem("${THEME_KEY}");var t=(s==="light"||s==="dark")?s:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");var r=document.documentElement;r.dataset.theme=t;r.style.colorScheme=t;}catch(e){}`;
