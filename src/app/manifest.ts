import type { MetadataRoute } from "next";
import { appConfig, withBasePath } from "@/lib/config";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appConfig.name,
    short_name: appConfig.shortName,
    description: appConfig.description,
    lang: "es",
    start_url: withBasePath("/"),
    scope: withBasePath("/"),
    display: "standalone",
    orientation: "portrait",
    background_color: appConfig.colors.warmWhite,
    theme_color: appConfig.colors.deepBlue,
    categories: ["lifestyle", "education", "books"],
    icons: [
      { src: withBasePath("/icons/icon-192.png"), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: withBasePath("/icons/icon-512.png"), sizes: "512x512", type: "image/png", purpose: "any" },
      { src: withBasePath("/icons/maskable-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: withBasePath("/icons/icon.svg"), sizes: "any", type: "image/svg+xml" },
    ],
    shortcuts: [
      { name: "Recibir una enseñanza", url: withBasePath("/ensenanza/") },
      { name: "Generar código QR", url: withBasePath("/qr/") },
    ],
  };
}
