import { describe, expect, it } from "vitest";
import { fetchPortalData } from "@/services/mock/portal";

describe("mock portal api", () => {
  it("returns the full linked domain dataset for the portal shell", async () => {
    const data = await fetchPortalData();

    expect(data.exporters).toHaveLength(3);
    expect(data.consignes).toHaveLength(3);
    expect(data.cargo).toHaveLength(3);
    expect(data.volumes).toHaveLength(3);
    expect(data.containers).toHaveLength(4);
    expect(data.vessels).toHaveLength(4);
    expect(data.documents.some((document) => document.type === "BL")).toBe(true);
    expect(data.cargo[0]?.exporterId).toBe("EXP-001");
    expect(data.cargo[0]?.consigneeId).toBe("CON-001");
    expect(data.volumes[0]?.cargoId).toBe("CARGO-101");
  });
});
