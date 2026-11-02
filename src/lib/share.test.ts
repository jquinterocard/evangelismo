import { describe, expect, it } from "vitest";
import { whatsappShareUrl } from "./share";

describe("WhatsApp", () => {
  it("codifica el texto y la URL", () => {
    const u = whatsappShareUrl("Una palabra de esperanza: «Fe» (Hebreos 11:1).", "https://x.github.io/evangelizmo/ensenanzas/fe-1/");
    expect(u.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(u.slice("https://wa.me/?text=".length))).toBe(
      "Una palabra de esperanza: «Fe» (Hebreos 11:1). https://x.github.io/evangelizmo/ensenanzas/fe-1/",
    );
    expect(u).not.toMatch(/[ «»]/);
  });
});
