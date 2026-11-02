import { describe, expect, it } from "vitest";
import {
  computeIso6346CheckDigit,
  isValidCaboVerdeNif,
  isValidPortugalNif,
  validateContainerNumber,
  validatePhone,
  validateVin,
} from "@/domain/validators";

describe("ISO 6346", () => {
  it("computes the check digit of a known container", () => {
    expect(computeIso6346CheckDigit("CSQU305438")).toBe(3);
  });

  it("accepts valid numbers with spaces or dashes", () => {
    expect(validateContainerNumber("CSQU 305438-3")).toEqual({ valid: true, normalized: "CSQU3054383" });
  });

  it("rejects a wrong check digit and reports the expected one", () => {
    expect(validateContainerNumber("CSQU3054384")).toEqual({
      valid: false,
      reason: "check-digit",
      expectedCheckDigit: 3,
    });
  });

  it("rejects malformed numbers", () => {
    expect(validateContainerNumber("CSQX3054383")).toMatchObject({ valid: false, reason: "format" });
    expect(validateContainerNumber("CNT-1042")).toMatchObject({ valid: false, reason: "format" });
  });
});

describe("VIN", () => {
  it("accepts a North American VIN with correct check digit", () => {
    expect(validateVin("1M8GDM9AXKP042788")).toMatchObject({ valid: true, checkDigit: "ok" });
  });

  it("rejects a North American VIN with wrong check digit", () => {
    expect(validateVin("1M8GDM9A1KP042788")).toEqual({ valid: false, reason: "check-digit" });
  });

  it("does not require the check digit on European VINs", () => {
    expect(validateVin("WVWZZZ1JZ3W386752")).toMatchObject({ valid: true });
  });

  it("rejects the letters I, O and Q and wrong lengths", () => {
    expect(validateVin("WVWZZZ1JZ3W38675O")).toEqual({ valid: false, reason: "characters" });
    expect(validateVin("WVWZZZ1JZ3")).toEqual({ valid: false, reason: "length" });
  });
});

describe("NIF", () => {
  it("validates Cabo Verde NIF as 9 digits", () => {
    expect(isValidCaboVerdeNif("123456789")).toBe(true);
    expect(isValidCaboVerdeNif("12345678")).toBe(false);
  });

  it("validates the Portuguese NIF check digit", () => {
    expect(isValidPortugalNif("123456789")).toBe(true);
    expect(isValidPortugalNif("123456780")).toBe(false);
  });
});

describe("phone (BR 3)", () => {
  it("requires the country code", () => {
    expect(validatePhone("9912233").valid).toBe(false);
  });

  it("checks length for Cabo Verde and Portugal", () => {
    expect(validatePhone("+238 991 22 33").valid).toBe(true);
    expect(validatePhone("00238 991 223").valid).toBe(false);
    expect(validatePhone("+351 912 345 678").valid).toBe(true);
    expect(validatePhone("+351 912 345").valid).toBe(false);
  });

  it("accepts other international numbers within E.164 length", () => {
    expect(validatePhone("+33 6 12 34 56 78").valid).toBe(true);
  });
});
