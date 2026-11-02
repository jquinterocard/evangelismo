"use client";

import { Moon, Sun } from "lucide-react";
import { toggleTheme, useTheme } from "@/lib/theme";

export function ThemeToggle({ withLabel = false, className = "" }: { withLabel?: boolean; className?: string }) {
  const theme = useTheme();
  const dark = theme === "dark";
  const label = dark ? "Desactivar modo noche" : "Activar modo noche";
  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      aria-pressed={dark}
      aria-label={withLabel ? undefined : label}
      title={label}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-3 rounded-full text-navy hover:bg-sky-soft ${className}`}
    >
      {dark ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
      {withLabel && <span className="font-semibold">{dark ? "Modo noche: activado" : "Modo noche: desactivado"}</span>}
    </button>
  );
}
