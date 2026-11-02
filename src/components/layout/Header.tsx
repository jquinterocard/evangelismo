"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/illustrations";
import { appConfig } from "@/lib/config";
import { isActive, navItems } from "./nav";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/90 backdrop-blur supports-[backdrop-filter]:bg-cream/75">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2">
        Saltar al contenido
      </a>
      <div className="container-page flex h-16 items-center gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={`${appConfig.name}, inicio`}>
          <Logo className="size-9 shrink-0" />
          <span className="truncate font-serif text-base font-semibold text-navy-ink sm:text-lg">{appConfig.name}</span>
        </Link>

        <nav aria-label="Principal" className="ml-auto hidden xl:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    title={"short" in item ? item.label : undefined}
                    className={`rounded-full px-2.5 py-2 text-[0.95rem] font-semibold whitespace-nowrap transition-colors ${
                      active ? "bg-sky text-navy-ink" : "text-muted hover:bg-sky-soft hover:text-navy-ink"
                    }`}
                  >
                    {"short" in item ? item.short : item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* En móvil la navegación está en la barra inferior; aquí solo el modo noche. */}
        <ThemeToggle className="ml-auto shrink-0 xl:ml-1" />
      </div>
    </header>
  );
}
