import { describe, expect, it } from "vitest";
import {
  InvalidTransitionError,
  canTransitionVolume,
  isFinalVolumeStatus,
  transitionContainer,
  transitionVolume,
  type ContainerStatus,
  type StatusChange,
  type VolumeStatus,
} from "@/domain/state-machine";

const volume = { id: "V1", status: "draft" as VolumeStatus, history: [] as StatusChange<VolumeStatus>[] };

describe("volume state machine (BR 22)", () => {
  it("follows the happy path to delivered", () => {
    const path: VolumeStatus[] = [
      "collected",
      "consolidated",
      "shipped",
      "arrived",
      "deconsolidated",
      "released",
      "delivered",
    ];

    const delivered = path.reduce(
      (current, to) => transitionVolume(current, to, { userId: "u-1", at: "2026-11-02T10:00:00Z" }),
      volume,
    );

    expect(delivered.status).toBe("delivered");
    expect(delivered.history).toHaveLength(path.length);
    expect(delivered.history[0]).toEqual({
      from: "draft",
      to: "collected",
      userId: "u-1",
      at: "2026-11-02T10:00:00Z",
      reason: undefined,
    });
    expect(isFinalVolumeStatus(delivered.status)).toBe(true);
  });

  it("rejects skipping states", () => {
    expect(() => transitionVolume(volume, "shipped", { userId: "u-1" })).toThrow(InvalidTransitionError);
  });

  it("allows holding and then releasing", () => {
    expect(canTransitionVolume("deconsolidated", "held")).toBe(true);
    expect(canTransitionVolume("held", "released")).toBe(true);
    expect(canTransitionVolume("held", "delivered")).toBe(false);
  });

  it("lets a consolidated volume go back to the warehouse before shipping", () => {
    expect(canTransitionVolume("consolidated", "collected")).toBe(true);
    expect(canTransitionVolume("shipped", "collected")).toBe(false);
  });

  it("does not mutate the original entity", () => {
    transitionVolume(volume, "collected", { userId: "u-1" });
    expect(volume.status).toBe("draft");
    expect(volume.history).toHaveLength(0);
  });
});

describe("container state machine", () => {
  it("can reopen a closed container but not an embarked one", () => {
    const container = { status: "sealed" as ContainerStatus, history: [] as StatusChange<ContainerStatus>[] };
    expect(transitionContainer(container, "open", { userId: "u-1" }).status).toBe("open");

    const embarked = transitionContainer(container, "shipped", { userId: "u-1" });
    expect(() => transitionContainer(embarked, "open", { userId: "u-1" })).toThrow(InvalidTransitionError);
  });
});
