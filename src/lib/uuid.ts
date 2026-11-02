/** Generación de UUID v4 con Web Crypto API. */

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

type CryptoLike = Pick<Crypto, "getRandomValues"> & { randomUUID?: () => string };

export function generateUuid(cryptoImpl: CryptoLike | undefined = globalThis.crypto): string {
  if (!cryptoImpl) throw new Error("Web Crypto API no disponible en este navegador.");
  if (typeof cryptoImpl.randomUUID === "function") return cryptoImpl.randomUUID().toLowerCase();
  // Respaldo para contextos no seguros (http) donde randomUUID no existe.
  const bytes = cryptoImpl.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
