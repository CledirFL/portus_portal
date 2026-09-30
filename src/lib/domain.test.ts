import { describe, expect, it } from "vitest";
import { mockCargo, mockConsignees, mockExporters, mockVolumes } from "@/mocks/domain";
import { filterByQuery, getExporterStatusLabel, getVolumeStatusTone } from "@/lib/domain";

describe("domain helpers", () => {
  it("maps exporter status labels correctly", () => {
    expect(getExporterStatusLabel("active")).toBe("Ativo");
    expect(getExporterStatusLabel("review")).toBe("Em revisão");
    expect(getExporterStatusLabel("blocked")).toBe("Bloqueado");
  });

  it("filters exports by query across key fields", () => {
    const result = filterByQuery(mockExporters, "portugal", ["legalName", "country", "contacts"]);
    expect(result).toHaveLength(1);
    expect(result[0]?.legalName).toBe("Atlantic Exports Ltd.");
  });

  it("computes the correct volume tone", () => {
    expect(getVolumeStatusTone("Pendente")).toBe("warning");
    expect(getVolumeStatusTone("Entregue")).toBe("success");
    expect(getVolumeStatusTone("Em armazém")).toBe("danger");
  });

  it("contains a mock consignee ready for the consignee form flow", () => {
    expect(mockConsignees[0]?.name).toBe("Maria Lopes");
    expect(mockVolumes[1]?.globalVolumeId).toBe("VOL-2024-002");
  });

  it("keeps explicit business relationships between exporters, consignments and cargo", () => {
    expect(mockCargo[0]?.exporterId).toBe("EXP-001");
    expect(mockCargo[0]?.consigneeId).toBe("CON-001");
    expect(mockVolumes[0]?.cargoId).toBe("CARGO-101");
  });
});
