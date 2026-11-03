import type { NextConfig } from "next";

/**
 * Sitio 100 % estático (output: 'export').
 * NEXT_PUBLIC_BASE_PATH permite publicar bajo una subruta, p. ej. "/evangelismo" en GitHub Pages.
 */
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";
const basePath =
  rawBasePath && rawBasePath !== "/" ? `/${rawBasePath.replace(/^\/+|\/+$/g, "")}` : "";

/**
 * Solo desarrollo: hosts adicionales que pueden cargar el servidor de `next dev`
 * (p. ej. abrir la app desde el celular en la red local). Separados por comas; admite
 * comodines, p. ej. DEV_ALLOWED_ORIGINS="192.168.1.*". No afecta al sitio exportado.
 */
const devAllowedOrigins = (process.env.DEV_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  output: "export",
  allowedDevOrigins: devAllowedOrigins,
  trailingSlash: true,
  basePath: basePath || undefined,
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
