import { describe, expect, it } from "vitest";
import { defaultRouteByRole, isAllowedRoute } from "@/lib/permissions";

describe("isAllowedRoute", () => {
  it("allows nested detail routes for the same module", () => {
    expect(isAllowedRoute("cv_operator", "/cv/chegadas/V-010")).toBe(true);
    expect(isAllowedRoute("transitario", "/agencia/contentores/c-1")).toBe(true);
  });

  it("allows the admin user registry route", () => {
    expect(isAllowedRoute("admin", "/admin/users")).toBe(true);
  });

  it("allows collection routes for field agents", () => {
    expect(isAllowedRoute("agente_recolha", "/agent/collections")).toBe(true);
    expect(isAllowedRoute("agente_recolha", "/agent/collections/new")).toBe(true);
  });

  it("blocks routes outside the current role", () => {
    expect(isAllowedRoute("exporter", "/cv/navios/V-010")).toBe(false);
    expect(isAllowedRoute("exporter", "/agent/collections")).toBe(false);
  });
});

describe("defaultRouteByRole", () => {
  it("sends each role to its workspace after login", () => {
    expect(defaultRouteByRole.agente_recolha).toBe("/agent/collections");
    expect(defaultRouteByRole.cliente).toBe("/cliente");
    expect(defaultRouteByRole.exporter).toBe("/exportador");
  });
});
