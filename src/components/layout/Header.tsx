"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BookOpen, Menu, QrCode, X } from "lucide-react";
import { Logo } from "@/components/illustrations";
import { appConfig } from "@/lib/config";
import { isActive, navItems } from "./nav";

export function Header() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Cierra el menú al navegar (ajuste de estado durante el render, patrón recomendado por React).
  if (open && openedAt !== pathname) setOpen(false);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === "Tab" && panel) {
        const focusables = [toggleRef.current, ...panel.querySelectorAll<HTMLElement>("a")].filter(Boolean) as HTMLElement[];
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/90 backdrop-blur supports-[backdrop-filter]:bg-cream/75">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Saltar al contenido
      </a>
      <div className="container-page flex h-16 items-center gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={`${appConfig.name}, inicio`}>
          <Logo className="size-9 shrink-0" />
          <span className="truncate font-serif text-base font-semibold text-navy-ink sm:text-lg">{appConfig.name}</span>
        </Link>

        <nav aria-label="Principal" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-full px-3 py-2 text-[0.95rem] font-semibold transition-colors ${
                      active ? "bg-sky text-navy-ink" : "text-muted hover:bg-sky-soft hover:text-navy-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:hidden">
          <Link href="/ensenanza/" className="grid size-11 place-items-center rounded-full text-navy hover:bg-sky-soft" aria-label="Recibir una enseñanza">
            <BookOpen className="size-5" aria-hidden />
          </Link>
          <Link href="/qr/" className="grid size-11 place-items-center rounded-full text-navy hover:bg-sky-soft" aria-label="Generar código QR">
            <QrCode className="size-5" aria-hidden />
          </Link>
          <button
            ref={toggleRef}
            type="button"
            className="grid size-11 place-items-center rounded-full text-navy hover:bg-sky-soft"
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => {
              setOpenedAt(pathname);
              setOpen((v) => !v);
            }}
          >
            {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="menu-movil"
          ref={panelRef}
          className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-line bg-cream lg:hidden"
        >
          <nav aria-label="Menú móvil" className="container-page py-4">
            <ul className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={`flex min-h-13 items-center rounded-2xl px-4 text-lg font-semibold ${
                        active ? "bg-sky text-navy-ink" : "text-navy-ink hover:bg-sky-soft"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
