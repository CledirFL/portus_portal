import { describe, expect, it } from "vitest";
import { containerNumberHint } from "@/modules/consolidation/container-number";

describe("containerNumberHint", () => {
  it("waits until the number is complete", () => {
    expect(containerNumberHint("CSQU305")).toBe("");
  });

  it("accepts a valid number with spaces or hyphens", () => {
    expect(containerNumberHint("CSQU 305438-3")).toBe("");
  });

  it("explains a wrong check digit or format", () => {
    expect(containerNumberHint("CSQU3054380")).toBe("Dígito de controlo errado: o último algarismo devia ser 3.");
    expect(containerNumberHint("CSQA3054383")).toBe("Formato: 4 letras (a última U, J ou Z) e 7 algarismos.");
  });
});
