export const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/ensenanzas/", label: "Enseñanzas" },
  { href: "/conociendo-a-jesus/", label: "Conociendo a Jesús" },
  { href: "/qr/", label: "Generar QR" },
  { href: "/impacto/", label: "Impacto Evangelístico" },
  { href: "/metas/", label: "Metas" },
  { href: "/actividades/", label: "Actividades" },
  { href: "/acerca/", label: "Acerca" },
] as const;

export function isActive(pathname: string, href: string): boolean {
  const p = pathname.endsWith("/") ? pathname : `${pathname}/`;
  if (href === "/") return p === "/";
  return p.startsWith(href);
}
