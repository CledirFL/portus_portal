import { describe, expect, it } from "vitest";
import { cargoTypes, getCargoType, operatorFieldIssues } from "@/domain/cargo-types";

describe("operator fields (BR 32)", () => {
  it("defines operator fields with labels for every cargo type", () => {
    for (const type of cargoTypes) {
      for (const field of type.operatorFields) {
        expect(field.label).toBeTruthy();
      }
    }
    expect(getCargoType("veiculo").operatorFields.filter((field) => field.required).map((field) => field.key)).toEqual(
      expect.arrayContaining(["vin", "make", "model", "year"]),
    );
  });

  it("only checks formats while the shipment is a draft", () => {
    expect(operatorFieldIssues("veiculo", { vin: "ABC" }, { requireAll: false })).toEqual([
      { key: "vin", message: "O VIN tem 17 caracteres, sem as letras I, O e Q." },
    ]);
    expect(operatorFieldIssues("veiculo", {}, { requireAll: false })).toEqual([]);
  });

  it("requires every mandatory field to validate", () => {
    const keys = operatorFieldIssues("veiculo", { make: "Toyota" }, { requireAll: true }).map((issue) => issue.key);
    expect(keys).toEqual(["vin", "model", "year", "engineCc", "fuel", "condition", "value"]);
  });

  it("accepts a complete vehicle and checks select options, HS codes and years", () => {
    const vehicle = {
      vin: "WVWZZZ1JZ3W386752",
      make: "Volkswagen",
      model: "Golf",
      year: "2003",
      engineCc: "1600",
      fuel: "Gasolina",
      condition: "Usado",
      value: "3500",
    };
    expect(operatorFieldIssues("veiculo", vehicle, { requireAll: true })).toEqual([]);
    expect(operatorFieldIssues("veiculo", { ...vehicle, fuel: "Carvão", year: "1900" }, { requireAll: true })).toHaveLength(2);
    expect(operatorFieldIssues("comercial", { hsCode: "12" }, { requireAll: false })[0]?.key).toBe("hsCode");
  });

  it("needs no extra fields for small parcels", () => {
    expect(operatorFieldIssues("encomenda_pequena", {}, { requireAll: true })).toEqual([]);
  });
});
