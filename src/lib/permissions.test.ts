import { describe, expect, it } from "vitest";
import { isAllowedRoute } from "@/lib/permissions";

describe("isAllowedRoute", () => {
  it("allows nested detail routes for the same module", () => {
    expect(isAllowedRoute("cv_operator", "/cv/navios/V-010")).toBe(true);
    expect(isAllowedRoute("exporter", "/exporter/shipments/SHP-2041")).toBe(true);
  });

  it("blocks routes outside the current role", () => {
    expect(isAllowedRoute("exporter", "/cv/navios/V-010")).toBe(false);
  });
});
