import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RotatingText } from "@/components/ui/rotating-text";

const items = ["em Portugal", "na América", "em França"];

function mockReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduce }) as unknown as typeof window.matchMedia;
}

describe("RotatingText", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("cycles through the items and wraps around", () => {
    mockReducedMotion(false);
    render(<RotatingText items={items} intervalMs={1000} />);

    expect(screen.getByText("em Portugal")).toHaveAttribute("data-active", "true");

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("na América")).toHaveAttribute("data-active", "true");
    expect(screen.getByText("em Portugal")).toHaveAttribute("data-active", "false");

    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText("em Portugal")).toHaveAttribute("data-active", "true");
  });

  it("stays on the first item when the user prefers reduced motion", () => {
    mockReducedMotion(true);
    render(<RotatingText items={items} intervalMs={1000} />);

    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByText("em Portugal")).toHaveAttribute("data-active", "true");
  });
});
