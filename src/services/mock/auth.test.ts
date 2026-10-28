import { describe, expect, it } from "vitest";
import { mockLogin } from "@/services/mock/auth";
import { mockPassword } from "@/mocks/users";

describe("mock authentication", () => {
  it("accepts the updated demo password", async () => {
    const result = await mockLogin("ana@portus.cv", mockPassword);

    expect(result.user.email).toBe("ana@portus.cv");
  });

  it("routes the field agent to the collection workspace", async () => {
    const result = await mockLogin("agente@portus.cv", mockPassword);

    expect(result.user.role).toBe("agente_recolha");
    expect(result.redirectTo).toBe("/agent/collections");
  });
});
