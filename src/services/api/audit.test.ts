import { describe, expect, it } from "vitest";
import { changedFields } from "@/services/api/audit";

describe("changedFields", () => {
  it("lists only the fields that changed, ignoring timestamps", () => {
    expect(
      changedFields(
        { status: "review", name: "Nuno", portId: null, updatedAt: "a" },
        { status: "active", name: "Nuno", portId: "p-1", updatedAt: "b" },
      ),
    ).toEqual([
      { key: "status", before: "review", after: "active" },
      { key: "portId", before: null, after: "p-1" },
    ]);
  });

  it("shows every field of a created record", () => {
    expect(changedFields(null, { code: "ENC-1" })).toEqual([{ key: "code", before: undefined, after: "ENC-1" }]);
  });
});
