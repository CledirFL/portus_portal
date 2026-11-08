import { describe, expect, it } from "vitest";
import { estimateVehicleTaxes, regimeIssues, type VehicleRegimeRule, type VehicleTaxSettings } from "@/domain/vehicle-taxes";

const settings: VehicleTaxSettings = {
  eurToCve: 110,
  vatPct: 15,
  communityTaxPct: 0.5,
  specificIceCve: 100_000,
  specificIceMaxAgeYears: 4,
  iceTiers: [
    { maxAgeYears: 4, ratePct: 10 },
    { maxAgeYears: 8, ratePct: 25 },
    { maxAgeYears: null, ratePct: 50 },
  ],
};
const base = { label: "", maxEngineCc: null, newOnly: false, requiredFuel: null, requiredDocuments: [], iceExempt: false, specificIceExempt: false, vatExempt: false };
const particular: VehicleRegimeRule = { ...base, code: "particular", label: "Particular", dutyRatePct: 20 };
const taxi: VehicleRegimeRule = { ...base, code: "taxi", label: "Táxi", dutyRatePct: 5, iceExempt: true, specificIceExempt: true, maxEngineCc: 1400, newOnly: true };
const now = new Date("2026-11-08T12:00:00Z");
const car = { year: 2023, condition: "Usado", engineCc: 1600, fuel: "Gasolina", valueEur: 9000, transportEur: 800, insuranceEur: 200 };

describe("estimateVehicleTaxes", () => {
  it("adds duties, ICE by age, the specific ICE for recent used cars, the community tax and VAT", () => {
    const estimate = estimateVehicleTaxes(car, particular, settings, now);
    // Valor aduaneiro = (9000 + 800 + 200) × 110 = 1 100 000 CVE; 3 anos.
    expect(estimate.customsValueCve).toBe(1_100_000);
    expect(estimate.ageYears).toBe(3);
    expect(estimate.lines.map((line) => [line.code, line.amountCve])).toEqual([
      ["duty", 220_000],
      ["ice", 132_000],
      ["specific_ice", 100_000],
      ["community_tax", 5_500],
      ["vat", 232_800],
    ]);
    expect(estimate.totalCve).toBe(690_300);
    expect(estimate.issues).toEqual([]);
  });

  it("uses the older ICE tier and skips the specific ICE after the age limit", () => {
    const estimate = estimateVehicleTaxes({ ...car, year: 2016 }, particular, settings, now);
    expect(estimate.lines.find((line) => line.code === "ice")?.ratePct).toBe(50);
    expect(estimate.lines.some((line) => line.code === "specific_ice")).toBe(false);
  });

  it("charges a new taxi only the reduced duty, the community tax and VAT", () => {
    const estimate = estimateVehicleTaxes({ ...car, condition: "Novo", year: 2026, engineCc: 1200 }, taxi, settings, now);
    expect(estimate.lines.map((line) => [line.code, line.amountCve])).toEqual([
      ["duty", 55_000],
      ["ice", 0],
      ["community_tax", 5_500],
      ["vat", 173_250],
    ]);
  });

  it("lists the regime conditions the car does not meet", () => {
    expect(regimeIssues(taxi, car)).toEqual(["Táxi: só para viaturas novas.", "Táxi: cilindrada até 1400 cm³."]);
    expect(regimeIssues({ ...particular, requiredFuel: "Elétrico", label: "Elétrico" }, car)).toEqual(["Elétrico: só para viaturas a elétrico."]);
  });
});
