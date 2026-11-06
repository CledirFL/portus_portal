import { describe, expect, it } from "vitest";
import {
  nextRequestStatuses,
  requestStatuses,
  requestStatusLabels,
  shipmentRequestSchema,
  type ShipmentRequestInput,
} from "@/domain/shipment-request";

const validInput: ShipmentRequestInput = {
  dispatchCountry: "PT",
  agencyId: "2f47f7b9-d76b-404b-841b-00dfc678542b",
  category: "encomenda_pequena",
  description: "Roupa e alimentos para a família",
  details: { quantity: "3", approxWeightKg: "" },
  handover: "entrega_na_agencia",
  sender: { name: "Rosa Tavares", phone: "+351 912 345 678", email: "" },
  recipient: { name: "Maria Lopes", phone: "+238 991 22 33", island: "São Vicente", nif: "123456789" },
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

  it("requires the recipient NIF with 9 digits", () => {
    const missing = shipmentRequestSchema.safeParse({ ...validInput, recipient: { ...validInput.recipient, nif: "" } });
    expect(missing.error?.issues.map((issue) => [issue.path.join("."), issue.message])).toContainEqual(["recipient.nif", "Indique o NIF do destinatário."]);
    const short = shipmentRequestSchema.safeParse({ ...validInput, recipient: { ...validInput.recipient, nif: "12345" } });
    expect(short.error?.issues[0]?.message).toBe("O NIF tem 9 algarismos.");
  });

  it("validates phones with country code", () => {
    const result = shipmentRequestSchema.safeParse({
      ...validInput,
      recipient: { ...validInput.recipient, phone: "9912233" },
    });
    expect(result.success).toBe(false);
  });
});

describe("request statuses", () => {
  it("has a visible label for every API status code", () => {
    for (const status of requestStatuses) {
      expect(requestStatusLabels[status]).toBeTruthy();
    }
  });

  it("offers only the transitions the API allows", () => {
    expect(nextRequestStatuses("submitted")).toEqual(["accepted", "rejected", "cancelled"]);
    expect(nextRequestStatuses("converted")).toEqual([]);
  });
});
