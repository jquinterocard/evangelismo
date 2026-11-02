"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Menu, QrCode } from "lucide-react";
import type { ComponentType } from "react";
import { LatinCrossIcon } from "@/components/LatinCrossIcon";
import { isActive, moreItems, primaryMobile } from "./nav";
import { useMobileMenu } from "./MobileMenu";

const icons: Record<(typeof primaryMobile)[number]["icon"], ComponentType<{ className?: string }>> = {
  home: Home,
  book: BookOpen,
  cross: LatinCrossIcon,
  qr: QrCode,
};

/** Barra de navegación inferior (solo móvil). */
export function BottomNav() {
  const pathname = usePathname() ?? "/";
  const { open, setOpen } = useMobileMenu();
  const moreActive = moreItems.some((i) => isActive(pathname, i.href));
  const item = "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[0.7rem] leading-tight font-bold";

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur no-print xl:hidden"
    >
      <ul className="mx-auto flex max-w-xl items-stretch gap-1 px-2 py-1">
        {primaryMobile.map((i) => {
          const Icon = icons[i.icon];
          const active = !open && isActive(pathname, i.href);
          return (
            <li key={i.href} className="flex flex-1">
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={`${item} ${active ? "bg-sky text-navy-ink" : "text-muted hover:text-navy-ink"}`}
              >
                <Icon className="size-5" aria-hidden />
                <span className="text-center">{i.label}</span>
              </Link>
            </li>
          );
        })}
        <li className="flex flex-1">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="menu-movil"
            onClick={() => setOpen(!open)}
            className={`${item} ${open || moreActive ? "bg-sky text-navy-ink" : "text-muted hover:text-navy-ink"}`}
          >
            <Menu className="size-5" aria-hidden />
            <span>Más</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
