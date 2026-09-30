import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RegisterPage from "@/app/register/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("Register page", () => {
  it("renders the self-registration flow for the portal", () => {
    render(<RegisterPage />);

    expect(screen.getByText(/criar conta no portus/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/empresa/i)).toBeInTheDocument();
    expect(screen.getByText(/exportador/i)).toBeInTheDocument();
  });
});
