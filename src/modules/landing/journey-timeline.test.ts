import { describe, expect, it } from "vitest";
import {
  CONTAINER,
  SHIP,
  agentX,
  boxState,
  containerState,
  journeySteps,
  shipX,
  stepIndexAt,
  track,
  vanX,
} from "@/modules/landing/journey-timeline";

describe("track", () => {
  const stops = [
    [0.2, 0],
    [0.4, 100],
  ] as const;

  it("holds the first and last values outside the stops", () => {
    expect(track(0, stops)).toBe(0);
    expect(track(1, stops)).toBe(100);
  });

  it("interpolates between stops", () => {
    expect(track(0.3, stops)).toBeCloseTo(50);
    expect(track(0.25, stops)).toBeGreaterThan(0);
    expect(track(0.25, stops)).toBeLessThan(50);
  });
});

describe("journey steps", () => {
  it("cover the whole scroll without gaps", () => {
    expect(journeySteps[0].range[0]).toBe(0);
    expect(journeySteps.at(-1)?.range[1]).toBe(1);
    journeySteps.slice(1).forEach((step, index) => {
      expect(step.range[0]).toBe(journeySteps[index].range[1]);
    });
  });

  it("finds the active step for a progress value", () => {
    expect(stepIndexAt(0)).toBe(0);
    expect(stepIndexAt(0.2)).toBe(1);
    expect(stepIndexAt(0.6)).toBe(3);
    expect(stepIndexAt(1)).toBe(4);
  });

  it("place each snapshot inside its own step", () => {
    journeySteps.forEach((step, index) => {
      expect(stepIndexAt(step.snapshot)).toBe(index);
    });
  });
});

describe("scene choreography", () => {
  it("keeps the box in the agent's hands while carried", () => {
    for (const p of [0.1, 0.12, 0.14, 0.42, 0.45]) {
      expect(boxState(p).x).toBeCloseTo(agentX(p));
    }
  });

  it("hides the box while it travels in the van", () => {
    expect(boxState(0.25).opacity).toBe(0);
    expect(boxState(0.25).x).toBeLessThan(vanX(0) + 170);
  });

  it("lifts the container without jumping from the yard to the ship", () => {
    const before = containerState(0.589);
    const lifted = containerState(0.59);
    expect(lifted.x).toBeCloseTo(before.x);
    expect(lifted.top).toBeCloseTo(before.top);

    const lowering = containerState(0.7099);
    const landed = containerState(0.71);
    expect(landed.onShip).toBe(true);
    expect(lowering.x).toBeCloseTo(landed.x, 0);
    expect(lowering.top).toBeCloseTo(landed.top, 0);
    expect(landed.x).toBe(SHIP.dockX + SHIP.slotX);
  });

  it("only sails after the container is on board", () => {
    expect(shipX(0.71)).toBe(SHIP.dockX);
    expect(shipX(1)).toBeGreaterThan(SHIP.dockX + CONTAINER.width);
  });
});
