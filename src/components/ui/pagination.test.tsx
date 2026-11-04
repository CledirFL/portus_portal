import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "@/components/ui/pagination";

describe("Pagination", () => {
  it("shows the visible range and moves between pages", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination page={2} pageSize={10} total={23} onPageChange={onPageChange} onPageSizeChange={vi.fn()} itemLabel="encomendas" />,
    );

    expect(screen.getByText("11–20 de 23 encomendas")).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Página seguinte" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables the arrows at the ends", () => {
    render(<Pagination page={1} pageSize={25} total={4} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Página seguinte" })).toBeDisabled();
  });

  it("offers 10, 25, 50 and 100 per page", () => {
    const onPageSizeChange = vi.fn();
    render(<Pagination page={1} pageSize={25} total={80} onPageChange={vi.fn()} onPageSizeChange={onPageSizeChange} />);

    const select = screen.getByRole("combobox");
    expect([...select.querySelectorAll("option")].map((option) => option.value)).toEqual(["10", "25", "50", "100"]);
    fireEvent.change(select, { target: { value: "50" } });
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });
});
