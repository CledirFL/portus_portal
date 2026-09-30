import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table } from "@/components/ui/table";

describe("Table", () => {
  it("allows horizontal scrolling on narrow mobile layouts", () => {
    render(
      <Table
        columns={[
          { key: "document", label: "Documento" },
          { key: "route", label: "Rota" },
        ]}
        rows={[
          { document: "BL-2024-001", route: "Mindelo → Rotterdam" },
          { document: "BL-2024-014", route: "Praia → Antwerp" },
        ]}
      />,
    );

    const container = screen.getByText("BL-2024-001").closest("table")?.parentElement;
    expect(container).toHaveClass("overflow-x-auto");
  });
});
