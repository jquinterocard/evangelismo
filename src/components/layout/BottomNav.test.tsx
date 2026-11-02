import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { MobileMenuPanel, MobileMenuProvider } from "./MobileMenu";

let pathname = "/ensenanzas/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("next/link", () => ({ default: ({ href, children, ...p }: { href: string; children: ReactNode }) => <a href={href} {...p}>{children}</a> }));

function setup() {
  return render(
    <MobileMenuProvider>
      <MobileMenuPanel />
      <BottomNav />
    </MobileMenuProvider>,
  );
}

describe("navegación móvil", () => {
  it("muestra Inicio, Enseñanzas, Conocer a Jesús, QR y Más", () => {
    pathname = "/ensenanzas/";
    setup();
    const nav = screen.getByRole("navigation", { name: "Navegación principal" });
    for (const name of ["Inicio", "Enseñanzas", "Conocer a Jesús", "QR"]) expect(nav).toContainElement(screen.getByRole("link", { name }));
    expect(screen.getByRole("link", { name: "Enseñanzas" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Conocer a Jesús" })).toHaveAttribute("href", "/conociendo-a-jesus/");
    expect(screen.getByRole("button", { name: "Más" })).toHaveAttribute("aria-expanded", "false");
  });

  it("«Más» abre el panel con el resto de secciones y el modo noche", async () => {
    const user = userEvent.setup();
    pathname = "/";
    setup();
    await user.click(screen.getByRole("button", { name: "Más" }));
    const dialog = screen.getByRole("dialog", { name: "Más secciones" });
    for (const name of ["Impacto Evangelístico", "Acerca del proyecto", "Privacidad"]) {
      expect(dialog).toContainElement(screen.getByRole("link", { name }));
    }
    expect(screen.queryByRole("link", { name: "Metas" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Actividades" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Modo noche/ })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
