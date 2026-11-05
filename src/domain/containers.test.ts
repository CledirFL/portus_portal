import { describe, expect, it } from "vitest";
import {
  capacityIssues,
  containerTypes,
  describeCapacityIssue,
  getContainerType,
  isValidUnLocode,
  manifestDeadline,
} from "@/domain/containers";

describe("container types", () => {
  it("uses ISO 6346 size-type codes with a positive payload", () => {
    for (const type of containerTypes) {
      expect(type.code).toMatch(/^[1-9L][0-9][A-Z][0-9]$/);
      expect(type.maxWeightKg).toBeGreaterThan(0);
    }
    expect(getContainerType("45G1")?.label).toBe("40' high cube");
    expect(getContainerType("99X9")).toBeUndefined();
  });
});

describe("capacityIssues (BR 11)", () => {
  const capacity = { maxWeightKg: 1000, maxVolumeM3: 2 };

  it("accepts a load that fits exactly", () => {
    expect(capacityIssues({ weightKg: 900, volumeM3: 1.5 }, { weightKg: 100, volumeM3: 0.5 }, capacity)).toEqual([]);
  });

  it("reports weight and volume excess with the totals", () => {
    expect(capacityIssues({ weightKg: 900, volumeM3: 1.9 }, { weightKg: 100.01, volumeM3: 0.2 }, capacity)).toEqual([
      { measure: "weight", limit: 1000, total: 1000.01 },
      { measure: "volume", limit: 2, total: 2.1 },
    ]);
  });

  it("does not check volume when the container has no volume limit", () => {
    expect(capacityIssues({ weightKg: 0, volumeM3: 99 }, { weightKg: 1, volumeM3: 99 }, { maxWeightKg: 10, maxVolumeM3: null })).toEqual([]);
  });

  it("does not suffer from floating point sums", () => {
    expect(capacityIssues({ weightKg: 0.1, volumeM3: 0.1 }, { weightKg: 0.2, volumeM3: 0.2 }, { maxWeightKg: 0.3, maxVolumeM3: 0.3 })).toEqual([]);
  });

  it("describes the issue in Portuguese", () => {
    expect(describeCapacityIssue({ measure: "weight", limit: 1000, total: 1200 }, "do contentor")).toBe(
      "Peso total 1200 kg excede o limite de 1000 kg do contentor.",
    );
  });
});

describe("manifestDeadline (BR 13, RF-A14)", () => {
  const now = new Date("2026-11-04T12:00:00Z");

  it("is pending while more than 72 hours remain", () => {
    expect(manifestDeadline(new Date("2026-11-07T13:00:00Z"), false, now)).toEqual({ state: "pending", hoursToEta: 73 });
  });

  it("alerts under 72 hours and after the ETA", () => {
    expect(manifestDeadline(new Date("2026-11-07T11:00:00Z"), false, now)).toEqual({ state: "alert", hoursToEta: 71 });
    expect(manifestDeadline(new Date("2026-11-04T10:00:00Z"), false, now)).toEqual({ state: "alert", hoursToEta: -2 });
  });

  it("does not alert once a manifest was sent", () => {
    expect(manifestDeadline(new Date("2026-11-04T10:00:00Z"), true, now)).toEqual({ state: "sent" });
  });
});

describe("isValidUnLocode", () => {
  it.each(["PTLIS", "FRLEH", "USBOS", "CVRAI", "NLRTM", "CNSH2"])("accepts %s", (code) => {
    expect(isValidUnLocode(code)).toBe(true);
  });

  it.each(["PTLI", "ptlis", "PT-LIS", "PTLIS1", "PTL1S"])("rejects %s", (code) => {
    expect(isValidUnLocode(code)).toBe(false);
  });
});
