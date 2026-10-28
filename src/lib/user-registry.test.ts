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

  it("uses the document's terminal operator and administrator responsibilities", () => {
    const terminalOperator = mockUserRegistry.find((user) => user.role === "cv_operator");
    const administrator = mockUserRegistry.find((user) => user.role === "admin");

    expect(terminalOperator?.department).toBe("Operações portuárias");
    expect(terminalOperator?.permissions).toEqual(
      expect.arrayContaining(["Registar chegada", "Desconsolidar", "Conferir", "Armazenar"]),
    );
    expect(administrator?.permissions).toEqual(
      expect.arrayContaining(["Utilizadores", "Perfis", "Tarifas", "Listas de itens restritos"]),
    );
  });
});
