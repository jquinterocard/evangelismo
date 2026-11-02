export const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/ensenanzas/", label: "Enseñanzas" },
  { href: "/conociendo-a-jesus/", label: "Conociendo a Jesús", short: "Conocer a Jesús" },
  { href: "/qr/", label: "Generar QR" },
  { href: "/impacto/", label: "Impacto Evangelístico", short: "Impacto" },
  { href: "/metas/", label: "Metas" },
  { href: "/actividades/", label: "Actividades" },
  { href: "/acerca/", label: "Acerca" },
] as const;

/** Destinos fijos de la barra inferior en móvil. */
export const primaryMobile = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/ensenanzas/", label: "Enseñanzas", icon: "book" },
  { href: "/conociendo-a-jesus/", label: "Conocer a Jesús", icon: "cross" },
  { href: "/qr/", label: "QR", icon: "qr" },
] as const;

/** Resto de secciones, en el panel «Más». */
export const moreItems = [
  { href: "/impacto/", label: "Impacto Evangelístico" },
  { href: "/metas/", label: "Metas" },
  { href: "/actividades/", label: "Actividades" },
  { href: "/acerca/", label: "Acerca del proyecto" },
  { href: "/privacidad/", label: "Privacidad" },
] as const;

export function isActive(pathname: string, href: string): boolean {
  const p = pathname.endsWith("/") ? pathname : `${pathname}/`;
  if (href === "/") return p === "/";
  return p.startsWith(href);
}
