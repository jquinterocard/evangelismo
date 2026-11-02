import type { ReactNode } from "react";
import type { IllustrationKey } from "@/types";
import { Illustration } from "@/components/illustrations";

export function PageHeader({
  eyebrow,
  title,
  description,
  illustration,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  illustration?: IllustrationKey;
  children?: ReactNode;
}) {
  return (
    <section className="sky-gradient border-b border-line/60">
      <div className="container-page flex flex-col items-start gap-6 py-10 sm:flex-row sm:items-center sm:py-14">
        <div className="flex-1">
          {eyebrow && <p className="mb-2 text-sm font-extrabold tracking-[0.14em] text-gold-ink uppercase">{eyebrow}</p>}
          <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
          {description && <div className="mt-3 max-w-2xl text-lg text-muted">{description}</div>}
          {children && <div className="mt-5">{children}</div>}
        </div>
        {illustration && <Illustration name={illustration} className="hidden h-36 w-auto shrink-0 sm:block" />}
      </div>
    </section>
  );
}
