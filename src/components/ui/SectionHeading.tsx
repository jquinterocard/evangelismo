import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  as?: "h1" | "h2";
}) {
  const a = align === "center" ? "text-center items-center mx-auto" : "text-left items-start";
  return (
    <div className={`flex max-w-2xl flex-col gap-2 ${a}`}>
      {eyebrow && <p className="text-sm font-extrabold tracking-[0.14em] text-gold-ink uppercase">{eyebrow}</p>}
      <Tag className={Tag === "h1" ? "text-3xl font-semibold sm:text-4xl" : "text-2xl font-semibold sm:text-3xl"}>{title}</Tag>
      {description && <p className="text-muted">{description}</p>}
    </div>
  );
}
