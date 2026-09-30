import { describe, expect, it } from "vitest";
import { filterUsersByQuery, getUserStatusLabel } from "@/lib/user-registry";
import { mockUserRegistry } from "@/mocks/users";

describe("user registry helpers", () => {
  it("returns the correct human label for each user status", () => {
    expect(getUserStatusLabel("active")).toBe("Ativo");
    expect(getUserStatusLabel("review")).toBe("Em revisão");
    expect(getUserStatusLabel("blocked")).toBe("Bloqueado");
  });

  it("filters users by name, email and company", () => {
    const result = filterUsersByQuery(mockUserRegistry, "joao");
    expect(result).toHaveLength(1);
    expect(result[0]?.email).toBe("joao@portus.cv");
  });
});
