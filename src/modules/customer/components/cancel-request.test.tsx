import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CancelRequest } from "@/modules/customer/components/cancel-request";

describe("CancelRequest", () => {
  it("asks for confirmation and sends the optional reason", async () => {
    const onCancel = vi.fn().mockResolvedValue(undefined);
    render(<CancelRequest onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar pedido" }));
    fireEvent.change(screen.getByLabelText("Motivo (opcional)"), { target: { value: "  Já não envio " } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cancelamento" }));

    await waitFor(() => expect(onCancel).toHaveBeenCalledWith("Já não envio"));
  });

  it("shows the server message when the request can no longer be cancelled", async () => {
    const onCancel = vi.fn().mockRejectedValue(new Error("Este pedido já não pode ser cancelado."));
    render(<CancelRequest onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar pedido" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cancelamento" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Este pedido já não pode ser cancelado.");
    expect(onCancel).toHaveBeenCalledWith(undefined);
  });
});
