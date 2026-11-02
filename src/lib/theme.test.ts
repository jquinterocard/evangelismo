import { describe, expect, it } from "vitest";
import { applyTheme, currentTheme, getStoredTheme, resolveInitialTheme, THEME_KEY, toggleTheme } from "./theme";

describe("modo noche", () => {
  it("prioriza la preferencia guardada, luego el sistema y por defecto claro", () => {
    expect(resolveInitialTheme("dark", false)).toBe("dark");
    expect(resolveInitialTheme("light", true)).toBe("light");
    expect(resolveInitialTheme(null, true)).toBe("dark");
    expect(resolveInitialTheme("rosa", false)).toBe("light");
  });

  it("aplica el tema al documento y lo recuerda", () => {
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem(THEME_KEY)).toBe("dark");
    expect(getStoredTheme()).toBe("dark");
    expect(toggleTheme()).toBe("light");
    expect(currentTheme()).toBe("light");
    expect(getStoredTheme()).toBe("light");
  });
});
