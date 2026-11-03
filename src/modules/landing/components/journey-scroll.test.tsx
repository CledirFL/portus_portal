import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JourneyScroll } from "@/modules/landing/components/journey-scroll";
import { journeySteps } from "@/modules/landing/journey-timeline";

function mockReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: reduce,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
}

describe("JourneyScroll", () => {
  it("shows every step as a still frame when the user prefers reduced motion", () => {
    mockReducedMotion(true);
    render(<JourneyScroll />);

    const section = screen.getByRole("region", { name: "Da sua porta ao porto da Praia." });
    const steps = within(section).getAllByRole("listitem");
    expect(steps).toHaveLength(journeySteps.length);
    journeySteps.forEach((step, index) => {
      expect(steps[index]).toHaveTextContent(step.title);
      expect(steps[index]).toHaveTextContent(step.text);
    });
  });
});
