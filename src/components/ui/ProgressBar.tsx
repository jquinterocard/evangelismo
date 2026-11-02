export function ProgressBar({
  value,
  max = 100,
  label,
  tone = "hope",
}: {
  value: number;
  max?: number;
  label: string;
  tone?: "hope" | "gold" | "navy";
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const color = tone === "gold" ? "bg-gold" : tone === "navy" ? "bg-navy" : "bg-hope";
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className="h-3 w-full overflow-hidden rounded-full bg-line/70"
    >
      <div className={`h-full rounded-full ${color} transition-[width] duration-700 ease-out`} style={{ width: `${pct}%` }} />
    </div>
  );
}
