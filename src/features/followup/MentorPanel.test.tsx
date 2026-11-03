import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RpcFn } from "@/features/completions/api";
import { ToastProvider } from "@/components/ui/Toast";
import { createMentorApi } from "./api";
import { Requests } from "./MentorPanel";

const row = {
  id: "77777777-7777-4777-8777-777777777777",
  created_at: "2026-11-03T15:00:00Z",
  teaching_id: "amor-de-dios-1-tanto-amo",
  name: "Ana María",
  whatsapp: "573001234567",
  email: "ana@example.com",
  preferred_contact: "llamada",
  prayer_request: "Por mi familia",
  status: "nuevo",
  notes: null,
  updated_at: null,
  updated_by: null,
};

function setup(rpcImpl?: RpcFn) {
  const rpc = vi.fn<RpcFn>(
    rpcImpl ??
      (async (fn) => {
        if (fn === "mentor_list_requests") return { data: [row], error: null };
        if (fn === "mentor_update_request") return { data: [{ status: "updated" }], error: null };
        return { data: [{ status: "deleted" }], error: null };
      }),
  );
  render(
    <ToastProvider>
      <Requests api={createMentorApi(rpc)} email="mentor@iglesia.org" onSignOut={() => {}} />
    </ToastProvider>,
  );
  return rpc;
}

describe("panel de mentores", () => {
  it("lista las solicitudes nuevas con WhatsApp, preferencia y petición", async () => {
    const rpc = setup();
    const card = (await screen.findByRole("heading", { name: "Ana María" })).closest("li")!;
    expect(rpc).toHaveBeenCalledWith("mentor_list_requests", { p_status: "nuevo" });
    expect(within(card).getByText("Llamada")).toBeInTheDocument();
    expect(within(card).getByText("Por mi familia")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: /Abrir WhatsApp/ }).getAttribute("href")).toMatch(/^https:\/\/wa\.me\/573001234567\?text=Hola%20Ana%2C/);
  });

  it("guarda estado y notas", async () => {
    const user = userEvent.setup();
    const rpc = setup();
    await screen.findByRole("heading", { name: "Ana María" });
    const save = screen.getByRole("button", { name: /Guardar/ });
    expect(save).toBeDisabled();
    await user.selectOptions(screen.getByLabelText("Estado"), "contactado");
    await user.type(screen.getByLabelText(/Notas del equipo/), "Le escribí");
    await user.click(save);
    expect(rpc).toHaveBeenCalledWith("mentor_update_request", { p_id: row.id, p_status: "contactado", p_notes: "Le escribí" });
    expect(await screen.findByText("Cambios guardados.")).toBeInTheDocument();
  });

  it("si el correo no es mentor, lo explica", async () => {
    setup(async () => ({ data: null, error: { message: "42501 No autorizado" } }));
    expect(await screen.findByText(/no está autorizado como mentor/)).toBeInTheDocument();
  });
});
