import { describe, expect, it } from "vitest";
import { dutyBandFor, estimateVehicleTaxes, regimeIssues, type VehicleRegimeRule, type VehicleTaxSettings } from "@/domain/vehicle-taxes";

/** Pauta Aduaneira 2026 (SH 2022), posição 8703, como nos dados de referência. */
const settings: VehicleTaxSettings = {
  eurToCve: 110.265,
  usdToCve: 100,
  vatPct: 15,
  communityTaxPct: 0.5,
  teaCve: 5000,
  dutyBands: [
    { fuel: "gasolina", maxEngineCc: 1000, ratePct: 20 },
    { fuel: "gasolina", maxEngineCc: 1500, ratePct: 30 },
    { fuel: "gasolina", maxEngineCc: 3000, ratePct: 40 },
    { fuel: "gasolina", maxEngineCc: null, ratePct: 50 },
    { fuel: "gasoleo", maxEngineCc: 1500, ratePct: 30 },
    { fuel: "gasoleo", maxEngineCc: 2500, ratePct: 40 },
    { fuel: "gasoleo", maxEngineCc: null, ratePct: 50 },
    { fuel: "hibrido", maxEngineCc: null, ratePct: 30 },
    { fuel: "eletrico", maxEngineCc: null, ratePct: 0 },
  ],
  specificIceCve: 100_000,
  specificIceMaxAgeYears: 4,
  iceTiers: [
    { maxAgeYears: 6, ratePct: 40 },
    { maxAgeYears: 10, ratePct: 80 },
    { maxAgeYears: null, ratePct: 150 },
  ],
  iceElectricTiers: [
    { maxAgeYears: 6, ratePct: 10 },
    { maxAgeYears: 10, ratePct: 20 },
    { maxAgeYears: null, ratePct: 60 },
  ],
};
const base = { label: "", dutyRatePct: null, iceExempt: false, vatExempt: false, maxEngineCc: null, newOnly: false, requiredFuel: null, requiredDocuments: [], oncePerYears: null };
const particular: VehicleRegimeRule = { ...base, code: "particular", label: "Particular" };
const taxi: VehicleRegimeRule = { ...base, code: "taxi", label: "Táxi", dutyRatePct: 5, iceExempt: true, maxEngineCc: 1400 };
const emigrant: VehicleRegimeRule = { ...base, code: "emigrante", label: "Emigrante", dutyRatePct: 0, vatExempt: true, oncePerYears: 4 };
const now = new Date("2026-11-08T12:00:00Z");
const eur = (amount: number) => ({ amount, currency: "EUR" as const });
const cve = (amount: number) => ({ amount, currency: "CVE" as const });
const amounts = (estimate: ReturnType<typeof estimateVehicleTaxes>) => estimate.lines.map((line) => [line.code, line.amountCve]);

describe("estimateVehicleTaxes (Pauta 8703)", () => {
  it("matches the reference calculator: 11 000 € used petrol car of 3 years and 1500 cm³, freight and insurance in escudos", () => {
    const estimate = estimateVehicleTaxes(
      { year: 2023, condition: "Usado", engineCc: 1500, fuel: "Gasolina", dispatchCountry: "PT", value: eur(11_000), transport: cve(165_000), insurance: cve(8000) },
      particular,
      settings,
      now,
    );
    expect(estimate.customsValueCve).toBe(1_385_915);
    expect(estimate.tariffLine).toBe("8703 · gasolina · até 1500 cm³");
    expect(amounts(estimate)).toEqual([
      ["duty", 415_775],
      ["ice", 100_000],
      ["community_tax", 6930],
      ["vat", 286_293],
      ["tea", 5000],
    ]);
    expect(estimate.totalCve).toBe(813_998);
  });

  it("charges ICE on CIF + DI by age for older used cars, and uses the diesel bands", () => {
    const petrol = estimateVehicleTaxes(
      { year: 2019, condition: "Usado", engineCc: 1300, fuel: "Gasolina", dispatchCountry: "PT", value: eur(7000), transport: eur(0), insurance: eur(0) },
      particular,
      settings,
      now,
    );
    expect(amounts(petrol)).toEqual([
      ["duty", 231_557],
      ["ice", 802_730],
      ["community_tax", 3859],
      ["vat", 271_500],
      ["tea", 5000],
    ]);
    expect(petrol.lines.find((line) => line.code === "ice")?.ratePct).toBe(80);
    expect(dutyBandFor(settings, "gasoleo", 1600)).toEqual({ ratePct: 40, label: "8703 · gasóleo · até 2500 cm³" });
    expect(dutyBandFor(settings, "gasolina", 3200)).toEqual({ ratePct: 50, label: "8703 · gasolina · mais de 3000 cm³" });
    expect(dutyBandFor(settings, "gasolina", null).ratePct).toBe(50);
  });

  it("charges a taxi the reduced 5 % duty without ICE, and a new car no ICE at all", () => {
    const newTaxi = estimateVehicleTaxes(
      { year: 2026, condition: "Novo", engineCc: 1200, fuel: "Gasolina", dispatchCountry: "PT", value: eur(9000), transport: eur(800), insurance: eur(200) },
      taxi,
      settings,
      now,
    );
    expect(newTaxi.customsValueCve).toBe(1_102_650);
    expect(amounts(newTaxi)).toEqual([
      ["duty", 55_133],
      ["ice", 0],
      ["community_tax", 5513],
      ["vat", 174_494],
      ["tea", 5000],
    ]);
  });

  it("exempts a returning emigrant from duty and VAT, but not from ICE", () => {
    const estimate = estimateVehicleTaxes(
      { year: 2016, condition: "Usado", engineCc: 2000, fuel: "Gasóleo", dispatchCountry: "FR", value: eur(6000), transport: eur(0), insurance: eur(0) },
      emigrant,
      settings,
      now,
    );
    expect(amounts(estimate)).toEqual([
      ["duty", 0],
      ["ice", 529_272],
      ["community_tax", 3308],
      ["vat", 0],
      ["tea", 5000],
    ]);
  });

  it("uses the electric ICE tiers, exempts electric cars from VAT and skips the ECOWAS levy inside ECOWAS", () => {
    const estimate = estimateVehicleTaxes(
      { year: 2021, condition: "Usado", engineCc: null, fuel: "Elétrico", dispatchCountry: "SN", value: eur(20_000), transport: eur(0), insurance: eur(0) },
      particular,
      settings,
      now,
    );
    expect(estimate.tariffLine).toBe("8703 · elétrico");
    expect(amounts(estimate)).toEqual([
      ["duty", 0],
      ["ice", 220_530],
      ["community_tax", 0],
      ["vat", 0],
      ["tea", 5000],
    ]);
  });

  it("converts dollars with the configured rate", () => {
    const estimate = estimateVehicleTaxes(
      { year: 2026, condition: "Novo", engineCc: 1000, fuel: "Gasolina", dispatchCountry: "US", value: { amount: 10_000, currency: "USD" }, transport: cve(0), insurance: cve(0) },
      particular,
      settings,
      now,
    );
    expect(estimate.customsValueCve).toBe(1_000_000);
    expect(estimate.lines[0]).toMatchObject({ ratePct: 20, amountCve: 200_000 });
  });

  it("lists the regime conditions the car does not meet", () => {
    expect(regimeIssues(taxi, { condition: "Usado", engineCc: 1600, fuel: "Gasolina" })).toEqual(["Táxi: cilindrada até 1400 cm³."]);
    expect(regimeIssues({ ...particular, newOnly: true, requiredFuel: "Elétrico", label: "Teste" }, { condition: "Usado", engineCc: 1000, fuel: "Gasolina" })).toEqual([
      "Teste: só para viaturas novas.",
      "Teste: só para viaturas a elétrico.",
    ]);
  });
});
