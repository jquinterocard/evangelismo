import { describe, expect, it } from "vitest";
import { buildQrUrl, buildTeachingUrl, parseQrParam, resolvePublicBase, validatePublicUrl } from "./urls";
import { internal, withBasePath } from "./config";

const ID = "0f8fad5b-d9cb-469f-a165-70867728950e";

describe("URLs públicas", () => {
  it("construye la URL del QR con y sin ruta base", () => {
    expect(buildQrUrl("https://mi-proyecto.vercel.app", ID)).toBe(`https://mi-proyecto.vercel.app/?qr=${ID}`);
    expect(buildQrUrl("https://usuario.github.io/evangelismo/", ID)).toBe(`https://usuario.github.io/evangelismo/?qr=${ID}`);
    expect(() => buildQrUrl("https://x.app", "no-uuid")).toThrow();
  });

  it("construye la URL de una enseñanza", () => {
    expect(buildTeachingUrl("https://usuario.github.io/repo", "fe-1-certeza")).toBe("https://usuario.github.io/repo/ensenanzas/fe-1-certeza/");
  });

  it("valida la URL pública", () => {
    expect(validatePublicUrl("https://mi-proyecto.vercel.app/")).toEqual({ ok: true, url: "https://mi-proyecto.vercel.app" });
    expect(validatePublicUrl("https://usuario.github.io/repo")).toEqual({ ok: true, url: "https://usuario.github.io/repo" });
    expect(validatePublicUrl("http://localhost:3000").ok).toBe(true);
    expect(validatePublicUrl("http://ejemplo.com").ok).toBe(false);
    expect(validatePublicUrl("javascript:alert(1)").ok).toBe(false);
    expect(validatePublicUrl("https://user:pass@x.com").ok).toBe(false);
    expect(validatePublicUrl("https://x.com/?a=1").ok).toBe(false);
    expect(validatePublicUrl("").ok).toBe(false);
  });

  it("resuelve la base: usuario > build > navegador + basePath", () => {
    expect(resolvePublicBase({ userUrl: "https://a.app", buildUrl: "https://b.app", origin: "http://localhost:3000" })).toBe("https://a.app");
    expect(resolvePublicBase({ userUrl: "inválida", buildUrl: "https://b.app", origin: "http://x" })).toBe("https://b.app");
    expect(resolvePublicBase({ buildUrl: "", origin: "https://u.github.io", basePath: "/repo" })).toBe("https://u.github.io/repo");
  });

  it("lee y valida el parámetro qr", () => {
    expect(parseQrParam(`?qr=${ID.toUpperCase()}`)).toEqual({ present: true, qrId: ID });
    expect(parseQrParam("?qr=<script>")).toEqual({ present: true, qrId: null });
    expect(parseQrParam("?otra=1")).toEqual({ present: false, qrId: null });
    expect(parseQrParam(null)).toEqual({ present: false, qrId: null });
  });

  it("normaliza la ruta base (compatibilidad de rutas estáticas)", () => {
    expect(internal.normalizeBasePath("evangelismo/")).toBe("/evangelismo");
    expect(internal.normalizeBasePath("/")).toBe("");
    expect(internal.normalizeBasePath(undefined)).toBe("");
    expect(withBasePath("/sw.js", "/repo")).toBe("/repo/sw.js");
    expect(withBasePath("icons/a.png", "")).toBe("/icons/a.png");
    expect(internal.normalizeSiteUrl("https://x.app/sub/")).toBe("https://x.app/sub");
    expect(internal.normalizeSiteUrl("ftp://x")).toBe("");
  });
});
