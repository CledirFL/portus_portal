import { describe, expect, it } from "vitest";
import { defaultRouteByRole, defaultRouteFor, isAllowedRoute, isReadOnly, navigationFor } from "@/lib/permissions";
import type { Role } from "@/types/user";

const as = (role: Role, permissions: string[] = []) => ({ role, permissions });

describe("isAllowedRoute", () => {
  it("allows nested detail routes for the same module", () => {
    expect(isAllowedRoute(as("cv_operator"), "/cv/chegadas/V-010")).toBe(true);
    expect(isAllowedRoute(as("transitario"), "/agencia/contentores/c-1")).toBe(true);
  });

  it("allows collection routes for field agents", () => {
    expect(isAllowedRoute(as("agente_recolha"), "/agent/collections")).toBe(true);
    expect(isAllowedRoute(as("agente_recolha"), "/agent/collections/new")).toBe(true);
  });

  it("blocks routes outside the current role", () => {
    expect(isAllowedRoute(as("exporter"), "/cv/navios/V-010")).toBe(false);
    expect(isAllowedRoute(as("exporter"), "/agent/collections")).toBe(false);
  });

  it("opens every administration page, profiles and blocks to the super admin", () => {
    const owner = as("super_admin");
    for (const href of ["/admin/users", "/admin/perfis", "/admin/bloqueios", "/agencia/importar", "/portaria", "/admin/auditoria"]) {
      expect(isAllowedRoute(owner, href)).toBe(true);
    }
  });

  it("shows a platform admin only the areas of the admin profile, never profiles, blocks or imports", () => {
    const government = as("admin", ["dashboard", "activity", "operations"]);
    expect(navigationFor(government).map((item) => item.href)).toEqual([
      "/dashboard",
      "/agencia/pedidos",
      "/agencia/encomendas",
      "/agencia/contentores",
      "/agencia/viagens",
      "/cv/chegadas",
      "/alfandega",
      "/alfandega/viaturas",
      "/dgtr",
      "/portaria",
      "/agencia-cv",
      "/admin/auditoria",
    ]);
    expect(isAllowedRoute(government, "/admin/users")).toBe(false);
    expect(isAllowedRoute(government, "/admin/perfis")).toBe(false);
    expect(isAllowedRoute(government, "/admin/bloqueios")).toBe(false);
    expect(isAllowedRoute(government, "/agencia/importar")).toBe(false);
    expect(isAllowedRoute(as("admin"), "/dashboard")).toBe(false);
  });
});

describe("defaultRouteFor", () => {
  it("sends each role to its workspace after login", () => {
    expect(defaultRouteByRole.agente_recolha).toBe("/agent/collections");
    expect(defaultRouteByRole.cliente).toBe("/cliente");
    expect(defaultRouteByRole.exporter).toBe("/exportador");
    expect(defaultRouteFor(as("super_admin"))).toBe("/dashboard");
  });

  it("sends a platform admin to the first area of the profile", () => {
    expect(defaultRouteFor(as("admin", ["tariffs", "agencies"]))).toBe("/admin/agencias");
    expect(defaultRouteFor(as("admin"))).toBe("/unauthorized");
  });

  it("makes only the platform admin read-only", () => {
    expect(isReadOnly(as("admin", ["operations"]))).toBe(true);
    expect(isReadOnly(as("super_admin"))).toBe(false);
    expect(isReadOnly(as("portaria"))).toBe(false);
  });
});
