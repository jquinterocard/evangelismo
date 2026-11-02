"use client";

import { useEffect } from "react";
import { withBasePath } from "@/lib/config";

/** Registra el service worker solo en producción (sitio exportado). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const scope = withBasePath("/");
    navigator.serviceWorker.register(withBasePath("/sw.js"), { scope }).catch(() => {
      /* PWA opcional: si falla, la app sigue funcionando */
    });
  }, []);
  return null;
}
