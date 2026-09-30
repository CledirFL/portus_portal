import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders children content", () => {
    render(<Button>Entrar</Button>);
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("calls onClick handler when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Clique</Button>);
    await user.click(screen.getByRole("button", { name: /clique/i }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
