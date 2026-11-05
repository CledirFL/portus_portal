import { describe, expect, it } from "vitest";
import { computeCharges, storageDays, suggestChannel, type TariffRule } from "@/domain/clearance";

describe("suggestChannel (BR 15)", () => {
  it("is green for an identified recipient without occurrences", () => {
    expect(suggestChannel({ occurrences: [], recipientIdentified: true })).toEqual({ channel: "green", reasons: [] });
  });

  it("is red for a broken seal, a discrepancy or a recipient without identification", () => {
    expect(suggestChannel({ occurrences: ["broken_seal"], recipientIdentified: true }).channel).toBe("red");
    expect(suggestChannel({ occurrences: ["missing"], recipientIdentified: true }).reasons).toEqual(["Divergência entre o manifesto e a carga."]);
    expect(suggestChannel({ occurrences: [], recipientIdentified: false }).reasons).toEqual(["Destinatário sem NIF nem documento registado."]);
  });
});

describe("computeCharges (RF-A26, BR 21, BR 25)", () => {
  const tariffs: TariffRule[] = [
    { code: "handling", label: "Manuseamento", unit: "per_volume", amountCve: 500, freeDays: 0 },
    { code: "storage", label: "Armazenagem", unit: "per_volume_day", amountCve: 100, freeDays: 7 },
  ];
  const arrivedAt = new Date("2026-11-01T10:00:00Z");

  it("charges handling per volume and nothing for storage within the free days", () => {
    const charges = computeCharges({ tariffs, volumes: 2, arrivedAt, now: new Date("2026-11-05T10:00:00Z"), dutiesCve: 0, paidCve: 0, exempt: false });
    expect(charges.lines).toEqual([{ code: "handling", label: "Manuseamento", quantity: 2, amountCve: 1000 }]);
    expect(charges).toMatchObject({ totalCve: 1000, balanceCve: 1000, storageDays: 4 });
  });

  it("charges storage per volume and day after the free days, plus duties", () => {
    const charges = computeCharges({ tariffs, volumes: 2, arrivedAt, now: new Date("2026-11-11T09:00:00Z"), dutiesCve: 1250.5, paidCve: 1000, exempt: false });
    expect(charges.storageDays).toBe(10);
    expect(charges.lines.map((line) => [line.code, line.quantity, line.amountCve])).toEqual([
      ["handling", 2, 1000],
      ["storage", 6, 600],
      ["duties", 1, 1250.5],
    ]);
    expect(charges).toMatchObject({ totalCve: 2850.5, paidCve: 1000, balanceCve: 1850.5 });
  });

  it("owes nothing with a confirmed exemption or once fully paid", () => {
    const base = { tariffs, volumes: 1, arrivedAt, now: new Date("2026-11-02T10:00:00Z"), dutiesCve: 0 };
    expect(computeCharges({ ...base, paidCve: 0, exempt: true }).balanceCve).toBe(0);
    expect(computeCharges({ ...base, paidCve: 600, exempt: false }).balanceCve).toBe(0);
  });

  it("counts a started day as a storage day", () => {
    expect(storageDays(arrivedAt, new Date("2026-11-01T10:00:01Z"))).toBe(1);
    expect(storageDays(null, new Date())).toBe(0);
  });
});
