import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createCompletionsApi, type RpcFn } from "./api";
import { CompletionPanel } from "./CompletionPanel";

vi.mock("next/link", () => ({ default: ({ href, children, ...p }: { href: string; children: ReactNode }) => <a href={href} {...p}>{children}</a> }));

const C = "33333333-3333-4333-8333-333333333333";

function fakeServer() {
  const responses = new Map<string, string>();
  const rpc = vi.fn<RpcFn>(async (fn, args) => {
    if (fn === "register_completion") return { data: [{ status: "registered", completion_id: C }], error: null };
    if (fn === "register_interest") {
      const existing = responses.get(String(args.p_completion_id));
      if (existing) return { data: [{ status: "duplicate", response: existing }], error: null };
      responses.set(String(args.p_completion_id), String(args.p_response));
      return { data: [{ status: "registered", response: args.p_response }], error: null };
    }
    return { data: null, error: { message: "?" } };
  });
  return { rpc, api: createCompletionsApi(rpc) };
}

describe("flujo de finalización e interés", () => {
  it("sin Supabase: botón deshabilitado y mensaje claro", () => {
    render(<CompletionPanel teachingId="fe-1-certeza" qrId={null} api={createCompletionsApi(null)} />);
    expect(screen.getByRole("button", { name: /He completado esta enseñanza/ })).toBeDisabled();
    expect(screen.getByText(/no está configurado/)).toBeInTheDocument();
  });

  it("completar → pregunta → «Sí» muestra bienvenida y ruta", async () => {
    const user = userEvent.setup();
    const { api, rpc } = fakeServer();
    render(<CompletionPanel teachingId="fe-1-certeza" qrId={null} api={api} minReadSeconds={0} />);
    await user.click(screen.getByRole("button", { name: /He completado esta enseñanza/ }));
    expect(await screen.findByText(/Gracias por completar/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enseñanza completada/ })).toBeDisabled();
    expect(screen.getByText(/¿Te gustaría seguir conociendo a Jesús\?/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Sí, quiero aprender más/ }));
    expect(await screen.findByText(/Qué alegría que quieras seguir aprendiendo/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Conociendo a Jesús/ })).toHaveAttribute("href", "/conociendo-a-jesus/");
    expect(rpc).toHaveBeenCalledWith("register_interest", expect.objectContaining({ p_completion_id: C, p_response: "positive" }));
  });

  it("«Por ahora no» muestra mensaje respetuoso sin insistir", async () => {
    const user = userEvent.setup();
    const { api } = fakeServer();
    render(<CompletionPanel teachingId="fe-1-certeza" qrId={null} api={api} minReadSeconds={0} />);
    await user.click(screen.getByRole("button", { name: /He completado esta enseñanza/ }));
    await user.click(await screen.findByRole("button", { name: /Por ahora no, gracias/ }));
    expect(await screen.findByText(/Que tengas un día lleno de paz y esperanza/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Sí, quiero aprender más/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Volver al inicio/ })).toBeInTheDocument();
  });

  it("«Omitir» registra la omisión", async () => {
    const user = userEvent.setup();
    const { api, rpc } = fakeServer();
    render(<CompletionPanel teachingId="fe-1-certeza" qrId={null} api={api} minReadSeconds={0} />);
    await user.click(screen.getByRole("button", { name: /He completado esta enseñanza/ }));
    await user.click(await screen.findByRole("button", { name: /Omitir pregunta/ }));
    expect(await screen.findByText(/aquí estaremos cuando quieras volver/)).toBeInTheDocument();
    expect(rpc).toHaveBeenLastCalledWith("register_interest", expect.objectContaining({ p_response: "skipped" }));
  });

  it("el botón espera un tiempo mínimo de lectura", () => {
    const { api } = fakeServer();
    render(<CompletionPanel teachingId="fe-1-certeza" qrId={null} api={api} minReadSeconds={30} />);
    expect(screen.getByRole("button", { name: /He completado esta enseñanza/ })).toBeDisabled();
  });

  it("límite alcanzado: mensaje y no se muestra la pregunta", async () => {
    const user = userEvent.setup();
    const api = createCompletionsApi(async () => ({ data: [{ status: "rate_limited" }], error: null }));
    render(<CompletionPanel teachingId="fe-1-certeza" qrId={null} api={api} minReadSeconds={0} />);
    await user.click(screen.getByRole("button", { name: /He completado esta enseñanza/ }));
    expect(await screen.findByText(/límite de registros/)).toBeInTheDocument();
    expect(screen.queryByText(/¿Te gustaría seguir conociendo a Jesús\?/)).not.toBeInTheDocument();
  });
});
