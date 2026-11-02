import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createCompletionsApi, type RpcFn } from "./api";
import { CompletionPanel } from "./CompletionPanel";

vi.mock("next/link", () => ({ default: ({ href, children, ...p }: { href: string; children: ReactNode }) => <a href={href} {...p}>{children}</a> }));

const C = "33333333-3333-4333-8333-333333333333";

function fakeServer(opts: { existingResponse?: string } = {}) {
  const responses = new Map<string, string>();
  const rpc = vi.fn<RpcFn>(async (fn, args) => {
    if (fn === "register_completion") {
      if (opts.existingResponse) return { data: [{ status: "duplicate", completion_id: C, response: opts.existingResponse }], error: null };
      return { data: [{ status: "registered", completion_id: C }], error: null };
    }
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

const opt = (name: RegExp) => screen.getByRole("button", { name });

describe("pregunta de interés en un solo paso", () => {
  it("muestra las tres opciones al final de la enseñanza", () => {
    const { api } = fakeServer();
    render(<CompletionPanel teachingId="fe-1-certeza" qrId={null} api={api} minReadSeconds={0} />);
    expect(screen.getByText(/¿Te gustaría seguir conociendo a Jesús\?/)).toBeInTheDocument();
    expect(opt(/Sí, quiero aprender más/)).toBeEnabled();
    expect(opt(/Por ahora no, gracias/)).toBeEnabled();
    expect(opt(/^Omitir$/)).toBeEnabled();
  });

  it("«Sí» registra la finalización y la respuesta positiva", async () => {
    const user = userEvent.setup();
    const { api, rpc } = fakeServer();
    render(<CompletionPanel teachingId="fe-1-certeza" qrId={null} api={api} minReadSeconds={0} />);
    await user.click(opt(/Sí, quiero aprender más/));
    expect(await screen.findByText(/Qué alegría que quieras seguir aprendiendo/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Conociendo a Jesús/ })).toHaveAttribute("href", "/conociendo-a-jesus/");
    expect(rpc.mock.calls.map((c) => c[0])).toEqual(["register_completion", "register_interest"]);
    expect(rpc).toHaveBeenLastCalledWith("register_interest", expect.objectContaining({ p_completion_id: C, p_response: "positive" }));
  });

  it("«Por ahora no» registra la respuesta negativa y no insiste", async () => {
    const user = userEvent.setup();
    const { api, rpc } = fakeServer();
    render(<CompletionPanel teachingId="fe-1-certeza" qrId={null} api={api} minReadSeconds={0} />);
    await user.click(opt(/Por ahora no, gracias/));
    expect(await screen.findByText(/Que tengas un día lleno de paz y esperanza/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Sí, quiero aprender más/ })).not.toBeInTheDocument();
    expect(rpc).toHaveBeenLastCalledWith("register_interest", expect.objectContaining({ p_response: "negative" }));
  });

  it("«Omitir» registra la omisión", async () => {
    const user = userEvent.setup();
    const { api, rpc } = fakeServer();
    render(<CompletionPanel teachingId="fe-1-certeza" qrId={null} api={api} minReadSeconds={0} />);
    await user.click(opt(/^Omitir$/));
    expect(await screen.findByText(/aquí estaremos cuando quieras volver/)).toBeInTheDocument();
    expect(rpc).toHaveBeenLastCalledWith("register_interest", expect.objectContaining({ p_response: "skipped" }));
  });

  it("si ya había respuesta para esa finalización, la respeta sin registrar otra", async () => {
    const user = userEvent.setup();
    const { api, rpc } = fakeServer({ existingResponse: "positive" });
    render(<CompletionPanel teachingId="fe-1-certeza" qrId={null} api={api} minReadSeconds={0} />);
    await user.click(opt(/Por ahora no, gracias/));
    expect(await screen.findByText(/Qué alegría/)).toBeInTheDocument();
    expect(rpc.mock.calls.map((c) => c[0])).toEqual(["register_completion"]);
  });

  it("sin Supabase: muestra el seguimiento pero aclara que no se guardó", async () => {
    const user = userEvent.setup();
    render(<CompletionPanel teachingId="fe-1-certeza" qrId={null} api={createCompletionsApi(null)} />);
    expect(screen.getByText(/tu respuesta no se guardará/)).toBeInTheDocument();
    await user.click(opt(/^Omitir$/));
    expect(await screen.findByText(/aquí estaremos cuando quieras volver/)).toBeInTheDocument();
    expect(screen.getByText(/no se guardó/)).toBeInTheDocument();
    expect(screen.queryByText(/quedaron registradas/)).not.toBeInTheDocument();
  });

  it("las opciones esperan un tiempo mínimo de lectura", () => {
    const { api } = fakeServer();
    render(<CompletionPanel teachingId="fe-1-certeza" qrId={null} api={api} minReadSeconds={30} />);
    expect(opt(/Sí, quiero aprender más/)).toBeDisabled();
    expect(opt(/^Omitir$/)).toBeDisabled();
  });

  it("límite alcanzado: mensaje y opciones deshabilitadas", async () => {
    const user = userEvent.setup();
    const api = createCompletionsApi(async () => ({ data: [{ status: "rate_limited" }], error: null }));
    render(<CompletionPanel teachingId="fe-1-certeza" qrId={null} api={api} minReadSeconds={0} />);
    await user.click(opt(/Sí, quiero aprender más/));
    expect(await screen.findByText(/límite de registros/)).toBeInTheDocument();
    expect(opt(/Por ahora no, gracias/)).toBeDisabled();
  });

  it("error de red: permite reintentar", async () => {
    const user = userEvent.setup();
    const api = createCompletionsApi(async () => {
      throw new Error("offline");
    });
    render(<CompletionPanel teachingId="fe-1-certeza" qrId={null} api={api} minReadSeconds={0} />);
    await user.click(opt(/^Omitir$/));
    expect(await screen.findByText(/No pudimos conectar/)).toBeInTheDocument();
    expect(opt(/^Omitir$/)).toBeEnabled();
  });
});
