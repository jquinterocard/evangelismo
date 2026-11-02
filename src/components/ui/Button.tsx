import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "gold" | "ghost" | "danger";
type Size = "md" | "lg" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-bold transition duration-200 ease-out select-none " +
  "active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none motion-safe:hover:-translate-y-0.5 text-center";

const variants: Record<Variant, string> = {
  primary: "bg-navy text-white shadow-[var(--shadow-soft)] hover:bg-navy-deep",
  secondary: "bg-white text-navy border border-navy/25 hover:border-navy hover:bg-sky-soft",
  gold: "bg-gold text-navy-ink shadow-[var(--shadow-glow)] hover:bg-[#cfa957]",
  ghost: "text-navy hover:bg-sky-soft",
  danger: "bg-white text-rose-ink border border-rose-ink/30 hover:bg-rose/40",
};

const sizes: Record<Size, string> = {
  sm: "min-h-10 px-4 text-sm",
  md: "min-h-12 px-5 text-base",
  lg: "min-h-14 px-7 text-lg",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size; icon?: ReactNode };

export function Button({ variant = "primary", size = "md", icon, className = "", children, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size; icon?: ReactNode };

export function LinkButton({ variant = "primary", size = "md", icon, className = "", children, ...rest }: LinkButtonProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
