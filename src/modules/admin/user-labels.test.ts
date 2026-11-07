import { describe, expect, it } from "vitest";
import { roleLabel, userScopeLabel } from "@/modules/admin/user-labels";
import type { ManagedUser } from "@/services/api/users";

const user = (patch: Partial<ManagedUser>): ManagedUser => ({
  id: "u-1",
  email: "a@b.cv",
  name: "Nuno",
  phone: null,
  role: "alfandega",
  status: "review",
  organization: null,
  accessNote: null,
  agency: null,
  port: null,
  adminProfile: null,
  lastLoginAt: null,
  createdAt: "2026-11-05T00:00:00.000Z",
  ...patch,
});

describe("user labels", () => {
  it("says what is missing before approval and where the person works after", () => {
    expect(userScopeLabel(user({ role: "alfandega" }))).toBe("sem porto");
    expect(userScopeLabel(user({ role: "transitario" }))).toBe("sem agência");
    expect(userScopeLabel(user({ role: "exporter" }))).toBe("—");
    expect(userScopeLabel(user({ role: "admin" }))).toBe("sem perfil de administração");
    expect(userScopeLabel(user({ role: "admin", adminProfile: { id: "p", name: "Governo — supervisão" } }))).toBe("Perfil: Governo — supervisão");
    expect(userScopeLabel(user({ role: "super_admin" }))).toBe("Toda a plataforma");
    expect(userScopeLabel(user({ role: "agente_maritimo", port: { id: "p", code: "CVRAI", name: "Porto da Praia", island: "Santiago" } }))).toBe(
      "Porto da Praia, Santiago",
    );
  });

  it("never shows undefined for an unknown profile", () => {
    expect(roleLabel("alfandega")).toBe("Alfândega");
    expect(roleLabel("novo_perfil")).toBe("novo_perfil");
  });
});
