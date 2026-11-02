/** Modo claro / noche. La preferencia se guarda solo en este navegador. */
"use client";

import { useSyncExternalStore } from "react";
import { THEME_COLORS, THEME_KEY, type Theme } from "./theme-script";

export { THEME_KEY, type Theme } from "./theme-script";

export function isTheme(v: unknown): v is Theme {
  return v === "light" || v === "dark";
}

/** Preferencia guardada > preferencia del sistema > claro. */
export function resolveInitialTheme(stored: unknown, prefersDark: boolean): Theme {
  if (isTheme(stored)) return stored;
  return prefersDark ? "dark" : "light";
}

export function getStoredTheme(): Theme | null {
  try {
    const v = window.localStorage.getItem(THEME_KEY);
    return isTheme(v) ? v : null;
  } catch {
    return null;
  }
}

export function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function applyTheme(theme: Theme, persist = true): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", THEME_COLORS[theme]));
  if (persist) {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* sin storage: el tema dura solo esta visita */
    }
  }
}

export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

/** Tema activo, reactivo a cambios. En el prerender devuelve "light". */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, currentTheme, () => "light");
}
