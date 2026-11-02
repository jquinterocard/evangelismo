"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { isActive, moreItems } from "./nav";
import { ThemeToggle } from "./ThemeToggle";

interface MenuState {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const MenuContext = createContext<MenuState>({ open: false, setOpen: () => {} });

export function useMobileMenu() {
  return useContext(MenuContext);
}

export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const [state, setState] = useState({ open: false, at: pathname });
  // Cierra el menú al navegar (ajuste de estado durante el render).
  if (state.open && state.at !== pathname) setState({ open: false, at: pathname });
  const value: MenuState = { open: state.open, setOpen: (open) => setState({ open, at: pathname }) };
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

/**
 * Panel «Más» en móvil. Se renderiza fuera del <header> para que `position: fixed`
 * se mida contra la ventana (el header usa backdrop-filter).
 */
export function MobileMenuPanel() {
  const { open, setOpen } = useMobileMenu();
  const pathname = usePathname() ?? "/";
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const opener = document.activeElement as HTMLElement | null;
    panel?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && panel) {
        const f = [...panel.querySelectorAll<HTMLElement>("a,button")];
        const first = f[0];
        const last = f[f.length - 1];
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
      opener?.focus?.();
    };
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Más secciones">
      <button type="button" aria-label="Cerrar menú" className="absolute inset-0 bg-[#0b1520]/50" tabIndex={-1} onClick={() => setOpen(false)} />
      <div
        id="menu-movil"
        ref={panelRef}
        className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-line bg-surface px-4 pt-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] shadow-[var(--shadow-soft)] motion-safe:animate-fade-up"
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="font-serif text-lg font-semibold text-navy-ink">Más secciones</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid size-11 place-items-center rounded-full text-navy hover:bg-sky-soft"
            aria-label="Cerrar menú"
          >
            <X className="size-6" aria-hidden />
          </button>
        </div>
        <nav aria-label="Más secciones">
          <ul className="flex flex-col gap-1">
            {moreItems.map((item) => {
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
        <div className="mt-3 border-t border-line pt-3">
          <ThemeToggle withLabel className="w-full justify-start px-4" />
        </div>
      </div>
    </div>
  );
}
