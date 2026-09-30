import { describe, expect, it } from "vitest";
import { gatePassFormSchema, shipmentFormSchema } from "@/schemas/portal";

describe("Portal validation schemas", () => {
  it("accepts valid shipment form values", () => {
    const result = shipmentFormSchema.safeParse({
      code: "BL-001",
      exporter: "Atlantic Exports",
      origin: "Mindelo",
      destination: "Rotterdam",
      status: "Em trânsito",
      eta: "2026-10-01",
      volume: "2.5k TEU",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid shipment data", () => {
    const result = shipmentFormSchema.safeParse({
      code: "B",
      exporter: "A",
      origin: "",
      destination: "",
      status: "Em trânsito",
      eta: "",
      volume: "",
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid gate pass values", () => {
    const result = gatePassFormSchema.safeParse({
      container: "CNT-1042",
      vehicle: "TRK-44",
      destination: "Terminal Norte",
      status: "Autorizado",
      notes: "Ok",
    });

    expect(result.success).toBe(true);
  });
});
