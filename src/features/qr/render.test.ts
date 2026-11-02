// @vitest-environment node
import sharp from "sharp";
import jsQR from "jsqr";
import { describe, expect, it } from "vitest";
import { contrastRatio, legibilityWarnings, QR_TEMPLATES, renderCardSvg, renderQrSvg, escapeXml } from "./render";
import { buildQrUrl } from "@/lib/urls";

const URL_TEXT = buildQrUrl("https://mi-proyecto.vercel.app", "0f8fad5b-d9cb-469f-a165-70867728950e");

async function decode(svg: string, width?: number) {
  const { data, info } = await sharp(Buffer.from(svg), { density: 96 })
    .resize(width)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data ?? null;
}

describe("renderQrSvg", () => {
  it.each(QR_TEMPLATES.map((t) => t.id))("la plantilla «%s» produce un QR legible", async (template) => {
    const r = renderQrSvg(URL_TEXT, { color: "#25476A", background: "#FFFFFF", size: 512, margin: 2, template });
    expect(r.svg.startsWith("<svg")).toBe(true);
    expect(r.pixelSize).toBe(512);
    if (template !== "minimal") {
      expect(r.emblemModules / r.modules).toBeLessThanOrEqual(0.2);
      expect(r.emblemModules % 2).toBe(1);
    } else {
      expect(r.emblemModules).toBe(0);
    }
    expect(await decode(r.svg)).toBe(URL_TEXT);
  });

  it("respeta colores personalizados y sanea colores inválidos", () => {
    const ok = renderQrSvg(URL_TEXT, { color: "#112233", background: "#fafaf7", size: 256, margin: 4, template: "minimal" });
    expect(ok.svg).toContain('fill="#112233"');
    const bad = renderQrSvg(URL_TEXT, { color: 'red"/><script>', background: "#fff", size: 256, margin: 4, template: "minimal" });
    expect(bad.svg).not.toContain("<script>");
    expect(bad.svg).toContain('fill="#25476A"');
  });

  it("la tarjeta imprimible incluye nombre, instrucción y un QR legible", async () => {
    const svg = renderCardSvg(URL_TEXT, { color: "#25476A", background: "#FFFFFF", size: 512, margin: 2, template: "cross" });
    expect(svg).toContain("Un Encuentro con Jesús");
    expect(svg).toContain("Escanea y descubre un mensaje de esperanza");
    expect(await decode(svg, 900)).toBe(URL_TEXT);
  });

  it("escapa texto en XML", () => {
    expect(escapeXml(`<a href="x">&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&apos;&lt;/a&gt;");
  });
});

describe("legibilidad", () => {
  it("calcula contraste", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
  });
  it("advierte contraste bajo e invertido", () => {
    expect(legibilityWarnings("#25476A", "#FFFFFF")).toEqual([]);
    expect(legibilityWarnings("#DDDDDD", "#FFFFFF").length).toBeGreaterThan(0);
    expect(legibilityWarnings("#FFFFFF", "#000000").some((w) => w.includes("invertido"))).toBe(true);
  });
});
