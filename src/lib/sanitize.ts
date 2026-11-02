/** Limpieza de texto libre introducido por el usuario. React escapa al renderizar; aquí normalizamos. */
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function cleanText(value: string, maxLength: number): string {
  return value.replace(CONTROL_CHARS, "").replace(/\r\n?/g, "\n").trim().slice(0, maxLength);
}

/** Valida un color hexadecimal #RRGGBB. */
export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}
