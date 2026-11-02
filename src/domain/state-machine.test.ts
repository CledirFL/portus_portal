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

const volume = { id: "V1", status: "Rascunho" as VolumeStatus, history: [] as StatusChange<VolumeStatus>[] };

describe("volume state machine (BR 22)", () => {
  it("follows the happy path to Entregue", () => {
    const path: VolumeStatus[] = [
      "Recolhido",
      "Consolidado",
      "Embarcado",
      "Chegado",
      "Desconsolidado",
      "Liberado",
      "Entregue",
    ];

    const delivered = path.reduce(
      (current, to) => transitionVolume(current, to, { userId: "u-1", at: "2026-11-02T10:00:00Z" }),
      volume,
    );

    expect(delivered.status).toBe("Entregue");
    expect(delivered.history).toHaveLength(path.length);
    expect(delivered.history[0]).toEqual({
      from: "Rascunho",
      to: "Recolhido",
      userId: "u-1",
      at: "2026-11-02T10:00:00Z",
      reason: undefined,
    });
    expect(isFinalVolumeStatus(delivered.status)).toBe(true);
  });

  it("rejects skipping states", () => {
    expect(() => transitionVolume(volume, "Embarcado", { userId: "u-1" })).toThrow(InvalidTransitionError);
  });

  it("allows holding and then releasing", () => {
    expect(canTransitionVolume("Desconsolidado", "Retido")).toBe(true);
    expect(canTransitionVolume("Retido", "Liberado")).toBe(true);
    expect(canTransitionVolume("Retido", "Entregue")).toBe(false);
  });

  it("does not mutate the original entity", () => {
    transitionVolume(volume, "Recolhido", { userId: "u-1" });
    expect(volume.status).toBe("Rascunho");
    expect(volume.history).toHaveLength(0);
  });
});

describe("container state machine", () => {
  it("can reopen a closed container but not an embarked one", () => {
    const container = { status: "Fechado" as ContainerStatus, history: [] as StatusChange<ContainerStatus>[] };
    expect(transitionContainer(container, "Aberto", { userId: "u-1" }).status).toBe("Aberto");

    const embarked = transitionContainer(container, "Embarcado", { userId: "u-1" });
    expect(() => transitionContainer(embarked, "Aberto", { userId: "u-1" })).toThrow(InvalidTransitionError);
  });
});
