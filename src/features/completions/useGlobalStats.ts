"use client";

import { useEffect, useState } from "react";
import type { DailyStat, TopTeaching } from "./api";
import { browserTimeZone, completionsApi } from "./client";

export type GlobalState<T> =
  | { status: "not_configured" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T; fetchedAt: number };

const cache = new Map<string, { at: number; promise: Promise<GlobalState<unknown>> }>();
const TTL = 60_000;

function cached<T>(key: string, load: () => Promise<GlobalState<T>>, force = false): Promise<GlobalState<T>> {
  const hit = cache.get(key);
  if (!force && hit && Date.now() - hit.at < TTL) return hit.promise as Promise<GlobalState<T>>;
  const promise = load();
  cache.set(key, { at: Date.now(), promise: promise as Promise<GlobalState<unknown>> });
  return promise;
}

/** Estadísticas diarias globales (Supabase) para un rango de fechas. */
export function useGlobalDaily(from: string, to: string, refreshKey = 0): GlobalState<DailyStat[]> {
  const configured = completionsApi.configured;
  const [state, setState] = useState<{ key: string; value: GlobalState<DailyStat[]> } | null>(null);
  const key = `daily:${from}:${to}:${refreshKey}`;

  useEffect(() => {
    if (!configured || !from || !to) return;
    let alive = true;
    cached<DailyStat[]>(
      key,
      async () => {
        const r = await completionsApi.dailyStats({ from, to, timeZone: browserTimeZone() });
        if (r.ok) return { status: "ready", data: r.data, fetchedAt: Date.now() };
        return r.reason === "not_configured" ? { status: "not_configured" } : { status: "error", message: r.message ?? "Error" };
      },
      refreshKey > 0,
    ).then((value) => alive && setState({ key, value }));
    return () => {
      alive = false;
    };
  }, [configured, key, from, to, refreshKey]);

  if (!configured) return { status: "not_configured" };
  return state?.key === key ? state.value : { status: "loading" };
}

export function useTopTeachings(from: string, to: string, refreshKey = 0): GlobalState<TopTeaching[]> {
  const configured = completionsApi.configured;
  const [state, setState] = useState<{ key: string; value: GlobalState<TopTeaching[]> } | null>(null);
  const key = `top:${from}:${to}:${refreshKey}`;

  useEffect(() => {
    if (!configured || !from || !to) return;
    let alive = true;
    cached<TopTeaching[]>(
      key,
      async () => {
        const r = await completionsApi.topTeachings({ from, to, timeZone: browserTimeZone(), limit: 8 });
        if (r.ok) return { status: "ready", data: r.data, fetchedAt: Date.now() };
        return r.reason === "not_configured" ? { status: "not_configured" } : { status: "error", message: r.message ?? "Error" };
      },
      refreshKey > 0,
    ).then((value) => alive && setState({ key, value }));
    return () => {
      alive = false;
    };
  }, [configured, key, from, to, refreshKey]);

  if (!configured) return { status: "not_configured" };
  return state?.key === key ? state.value : { status: "loading" };
}
