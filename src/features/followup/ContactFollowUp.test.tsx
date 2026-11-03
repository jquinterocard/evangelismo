import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createCompletionsApi, type RpcFn } from "@/features/completions/api";
import { CompletionPanel } from "@/features/completions/CompletionPanel";
import { whatsappChatUrl } from "@/lib/share";
import { createFollowupApi } from "./api";
import { ContactForm } from "./ContactForm";

vi.mock("next/link", () => ({ default: ({ href, children, ...p }: { href: string; children: ReactNode }) => <a href={href} {...p}>{children}</a> }));

const C = "33333333-3333-4333-8333-333333333333";
const S = "11111111-1111-4111-8111-111111111111";

const completions = createCompletionsApi(async (fn, args) =>
  fn === "register_completion"
    ? { data: [{ status: "registered", completion_id: C }], error: null }
    : { data: [{ status: "registered", response: args.p_response }], error: null },
);

function followupServer(status = "registered") {
  const rpc = vi.fn<RpcFn>(async () => ({ data: [{ status }], error: null }));
  return { rpc, api: createFollowupApi(rpc) };
}

async function answerYes(props: Partial<Parameters<typeof CompletionPanel>[0]> = {}) {
  const user = userEvent.setup();
  render(
    <CompletionPanel teachingId="fe-1-certeza" teachingTitle="La certeza de la fe" qrId={null} api={completions} minReadSeconds={0} {...props} />,
  );
  await user.click(screen.getByRole("button", { name: /Sí, quiero aprender más/ }));
  await screen.findByText(/Qué alegría/);
  return user;
}

describe("whatsappChatUrl", () => {
  it("usa solo dígitos y codifica el mensaje", () => {
    expect(whatsappChatUrl("+57 300-123 4567", "Hola «Fe»")).toBe("https://wa.me/573001234567?text=Hola%20%C2%ABFe%C2%BB");
  });
});

describe("«¿Quieres hablar con alguien?» tras responder «Sí»", () => {
  it("con número configurado: enlace de WhatsApp con el título de la enseñanza", async () => {
    await answerYes({ contactPhone: "573001234567", followupApi: createFollowupApi(null) });
    const link = screen.getByRole("link", { name: /Escribir por WhatsApp/ });
    expect(link.getAttribute("href")).toBe(
      whatsappChatUrl("573001234567", "Hola, leí la enseñanza «La certeza de la fe» y me gustaría hablar con alguien sobre Jesús."),
    );
    expect(screen.queryByRole("button", { name: /Prefiero que me contacten/ })).not.toBeInTheDocument();
  });

  it("sin número ni Supabase: no muestra el bloque", async () => {
    await answerYes({ contactPhone: "", followupApi: createFollowupApi(null) });
    expect(screen.queryByText(/Quieres hablar con alguien/)).not.toBeInTheDocument();
  });

  it("con Supabase: ofrece el formulario y lo envía con la finalización registrada", async () => {
    const { rpc, api } = followupServer();
    const user = await answerYes({ contactPhone: "", followupApi: api });
    await user.click(screen.getByRole("button", { name: /Prefiero que me contacten/ }));
    await user.type(screen.getByLabelText(/Tu nombre/), "Ana");
    await user.type(screen.getByLabelText(/Tu WhatsApp/), "57 300 123 4567");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Enviar solicitud/ }));
    expect(await screen.findByText(/Pronto te contactaremos/)).toBeInTheDocument();
    expect(rpc).toHaveBeenCalledWith(
      "submit_contact_request",
      expect.objectContaining({ p_completion_id: C, p_name: "Ana", p_whatsapp: "573001234567", p_email: null, p_preferred: "whatsapp", p_consent: true }),
    );
  });
});

describe("ContactForm", () => {
  it("exige nombre, número válido y autorización antes de enviar", async () => {
    const user = userEvent.setup();
    const { rpc, api } = followupServer();
    render(<ContactForm completionId={C} api={api} sessionId={() => S} />);
    await user.type(screen.getByLabelText(/Tu WhatsApp/), "123");
    await user.click(screen.getByRole("button", { name: /Enviar solicitud/ }));
    expect(screen.getByText(/Escribe tu nombre/)).toBeInTheDocument();
    expect(screen.getByText(/indicativo de país, por ejemplo/)).toBeInTheDocument();
    expect(screen.getByText(/Necesitamos tu autorización/)).toBeInTheDocument();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("muestra un error recuperable si el servidor no responde", async () => {
    const user = userEvent.setup();
    const api = createFollowupApi(async () => {
      throw new Error("offline");
    });
    render(<ContactForm completionId={C} api={api} sessionId={() => S} />);
    await user.type(screen.getByLabelText(/Tu nombre/), "Ana");
    await user.type(screen.getByLabelText(/Tu WhatsApp/), "573001234567");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Enviar solicitud/ }));
    expect(await screen.findByText(/No pudimos conectar/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enviar solicitud/ })).toBeEnabled();
  });
});
