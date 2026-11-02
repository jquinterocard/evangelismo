import type { SVGProps } from "react";

/** Cruz latina con el mismo trazo que los iconos de Lucide (Lucide solo trae una cruz griega). */
export function LatinCrossIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...props}
    >
      <path d="M10 2h4v5h5v4h-5v11h-4V11H5V7h5z" />
    </svg>
  );
}
