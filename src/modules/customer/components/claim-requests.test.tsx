import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClaimRequests } from "@/modules/customer/components/claim-requests";

const api = vi.hoisted(() => ({ count: vi.fn(), start: vi.fn(), confirm: vi.fn() }));
vi.mock("@/services/api/shipment-requests", () => ({
  countClaimableRequests: api.count,
  requestClaimCode: api.start,
  confirmClaimCode: api.confirm,
}));

describe("ClaimRequests", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stays hidden when there is nothing to join", async () => {
    api.count.mockResolvedValue({ count: 0, email: "rosa@example.pt" });
    const { container } = render(<ClaimRequests onClaimed={vi.fn()} />);
    await waitFor(() => expect(api.count).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("sends the code and joins the requests once it is confirmed", async () => {
    api.count.mockResolvedValue({ count: 2, email: "rosa@example.pt" });
    api.start.mockResolvedValue({ count: 2, email: "rosa@example.pt", expiresAt: "" });
    api.confirm.mockResolvedValue({ linked: 2 });
    const onClaimed = vi.fn();
    render(<ClaimRequests onClaimed={onClaimed} />);

    expect(await screen.findByText("Tem 2 pedidos feitos sem conta com o email rosa@example.pt")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Juntar à minha conta" }));
    fireEvent.change(await screen.findByLabelText("Código do email"), { target: { value: "12a3456" } });
    expect(screen.getByLabelText("Código do email")).toHaveValue("123456");
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => expect(onClaimed).toHaveBeenCalledWith(2));
    expect(api.confirm).toHaveBeenCalledWith("123456");
  });
});
