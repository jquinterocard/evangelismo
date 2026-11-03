/** Compartir con Web Share API y respaldo de copiar al portapapeles. */

export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* continuar con el respaldo */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

export async function shareOrCopy(data: { title: string; text: string; url: string }): Promise<ShareOutcome> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(data);
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
    }
  }
  return (await copyText(data.url)) ? "copied" : "failed";
}

/** Enlace para compartir por WhatsApp (abre la app o WhatsApp Web). */
export function whatsappShareUrl(text: string, url: string): string {
  const message = [text.trim(), url.trim()].filter(Boolean).join(" ");
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/** Enlace para abrir un chat de WhatsApp con un número concreto y un mensaje ya escrito. */
export function whatsappChatUrl(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, "");
  const msg = text.trim();
  return `https://wa.me/${digits}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;
}
