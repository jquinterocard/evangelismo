"use client";

import { useSyncExternalStore } from "react";
import type { Store } from "@/lib/storage";

/** Suscribe un componente a un almacén local. En prerender/hidratación usa el valor por defecto. */
export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.read, store.defaultSnapshot);
}

const noop = () => () => {};

/** true solo después de hidratar en el navegador. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
