import { describe, expect, it } from "vitest";
import {
  createShipmentRequest,
  generateRequestReference,
  matchesPublicLookup,
  shipmentRequestSchema,
  transitionRequest,
  type ShipmentRequestInput,
} from "@/domain/shipment-request";

const validInput: ShipmentRequestInput = {
  agencyId: "AG-LIS",
  category: "encomenda_pequena",
  description: "Roupa e alimentos para a família",
  details: { quantity: "3", approxWeightKg: "" },
  handover: "entrega_na_agencia",
  sender: { name: "Rosa Tavares", phone: "+351 912 345 678", email: "" },
  recipient: { name: "Maria Lopes", phone: "+238 991 22 33", island: "São Vicente", nif: "" },
};

describe("shipment request schema", () => {
  it("accepts a minimal guest request", () => {
    expect(shipmentRequestSchema.safeParse(validInput).success).toBe(true);
  });

  it("requires the fields defined by the cargo type (BR 43)", () => {
    const result = shipmentRequestSchema.safeParse({ ...validInput, category: "veiculo", details: { make: "Toyota" } });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain("details.model");
  });

  it("requires a pickup address when pickup is chosen", () => {
    const result = shipmentRequestSchema.safeParse({ ...validInput, handover: "recolha", pickupAddress: "" });
    expect(result.error?.issues[0].path).toEqual(["pickupAddress"]);
  });

  it("validates phones with country code", () => {
    const result = shipmentRequestSchema.safeParse({
      ...validInput,
      recipient: { ...validInput.recipient, phone: "9912233" },
    });
    expect(result.success).toBe(false);
  });
});

describe("shipment request lifecycle", () => {
  const request = createShipmentRequest(validInput, { id: "r1", reference: "PED-ABC234", now: "2026-11-02T09:00:00Z" });

  it("starts as Submetido with normalized phones and empty details removed", () => {
    expect(request.status).toBe("Submetido");
    expect(request.sender.phone).toBe("+351912345678");
    expect(request.details).toEqual({ quantity: "3" });
    expect(request.pickupAddress).toBeUndefined();
  });

  it("records transitions and rejects invalid ones", () => {
    const accepted = transitionRequest(request, "Aceite", { userId: "agent", at: "2026-11-02T10:00:00Z" });
    expect(accepted.history).toHaveLength(1);
    expect(() => transitionRequest(accepted, "Submetido", { userId: "agent" })).toThrow();
  });

  it("only allows public lookup with reference and sender phone (BR 42)", () => {
    expect(matchesPublicLookup(request, "ped-abc234", "+351 912 345 678")).toBe(true);
    expect(matchesPublicLookup(request, "PED-ABC234", "+238 991 22 33")).toBe(false);
  });
});

describe("generateRequestReference", () => {
  it("uses an unambiguous alphabet", () => {
    const reference = generateRequestReference();
    expect(reference).toMatch(/^PED-[A-HJ-NP-Z2-9]{6}$/);
  });
});
