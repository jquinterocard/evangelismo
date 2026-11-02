import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "sky",
  children,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "sky" | "gold" | "hope" | "rose";
  children?: ReactNode;
}) {
  const tones = {
    sky: "bg-sky text-navy",
    gold: "bg-gold-soft text-gold-ink",
    hope: "bg-hope-soft text-hope-ink",
    rose: "bg-rose/60 text-rose-ink",
  } as const;
  return (
    <div className="card flex flex-col gap-2 p-5">
      <div className="flex items-center gap-3">
        {icon && <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span>}
        <p className="text-sm font-bold leading-tight text-muted">{label}</p>
      </div>
      <p className="font-serif text-3xl font-semibold text-navy-ink tabular-nums">{value}</p>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      {children}
    </div>
  );
}
