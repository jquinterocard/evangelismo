import type { ReactNode } from "react";
import type { IllustrationKey } from "@/types";
import { Illustration } from "@/components/illustrations";

export function EmptyState({
  title,
  description,
  illustration = "seed",
  action,
}: {
  title: string;
  description: ReactNode;
  illustration?: IllustrationKey;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
      <Illustration name={illustration} className="h-28 w-auto" />
      <h3 className="text-xl font-semibold">{title}</h3>
      <div className="max-w-md text-muted">{description}</div>
      {action}
    </div>
  );
}
