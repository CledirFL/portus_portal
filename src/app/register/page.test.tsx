import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RegisterPage from "@/app/register/page";

const requestAccess = vi.fn();
vi.mock("@/services/api/users", () => ({ requestAccess: (...args: unknown[]) => requestAccess(...args) }));

describe("Register page", () => {
  it("sends an access request for staff and explains the review", async () => {
    requestAccess.mockResolvedValue(undefined);
    render(<RegisterPage />);

    expect(screen.getByText("Pedir acesso para a equipa")).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Exportador" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nome completo"), { target: { value: "Nuno Lopes" } });
    fireEvent.change(screen.getByLabelText("Email profissional"), { target: { value: "nuno@alfandega.cv" } });
    fireEvent.change(screen.getByLabelText("Telefone"), { target: { value: "+238 991 00 11" } });
    fireEvent.change(screen.getByLabelText("Empresa ou entidade"), { target: { value: "Alfândega da Praia" } });
    fireEvent.change(screen.getByLabelText("Perfil"), { target: { value: "alfandega" } });
    fireEvent.change(screen.getByLabelText("Palavra-passe"), { target: { value: "segredo123" } });
    fireEvent.change(screen.getByLabelText("Confirmar palavra-passe"), { target: { value: "segredo123" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Pedir acesso" }));

    await waitFor(() => expect(screen.getByText("Pedido de acesso enviado")).toBeInTheDocument());
    expect(requestAccess).toHaveBeenCalledWith(
      expect.objectContaining({ email: "nuno@alfandega.cv", role: "alfandega", organization: "Alfândega da Praia", password: "segredo123" }),
    );
  });
});
