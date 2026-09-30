import { describe, expect, it } from "vitest";
import { getStatusTone } from "@/lib/status";

describe("getStatusTone", () => {
  it("returns success for approved states", () => {
    expect(getStatusTone("Validado")).toBe("success");
    expect(getStatusTone("Liberado")).toBe("success");
  });

  it("returns danger for non-compliant or delayed states", () => {
    expect(getStatusTone("Atrasado")).toBe("danger");
    expect(getStatusTone("Não conforme")).toBe("danger");
  });

  it("returns warning for pending or review states", () => {
    expect(getStatusTone("Pendente")).toBe("warning");
    expect(getStatusTone("Em revisão")).toBe("warning");
  });
});
