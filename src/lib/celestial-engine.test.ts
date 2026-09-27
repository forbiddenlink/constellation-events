import { describe, it, expect } from "vitest";
import { getOptimalObservationWindow } from "./celestial-engine";

// Las Vegas — the app's default fallback location.
const LAT = 36.1147;
const LNG = -115.1728;

describe("getOptimalObservationWindow", () => {
  it("ends after it starts (regression: dawn used to be pulled from the same day as dusk)", () => {
    const window = getOptimalObservationWindow(LAT, LNG, new Date("2026-09-27T12:00:00.000Z"));
    expect(window.start).not.toBeNull();
    expect(window.end).not.toBeNull();
    expect(window.end!.getTime()).toBeGreaterThan(window.start!.getTime());
  });

  it("produces a plausible overnight duration, not a negative or day-long one", () => {
    const window = getOptimalObservationWindow(LAT, LNG, new Date("2026-01-15T12:00:00.000Z"));
    const durationHours = (window.end!.getTime() - window.start!.getTime()) / (1000 * 60 * 60);
    expect(durationHours).toBeGreaterThan(0);
    expect(durationHours).toBeLessThan(16);
  });

  it("holds across a range of dates and seasons", () => {
    const dates = [
      "2026-03-01T12:00:00.000Z",
      "2026-06-21T12:00:00.000Z",
      "2026-09-27T12:00:00.000Z",
      "2026-12-21T12:00:00.000Z",
    ];
    for (const iso of dates) {
      const window = getOptimalObservationWindow(LAT, LNG, new Date(iso));
      if (window.start && window.end) {
        expect(window.end.getTime()).toBeGreaterThan(window.start.getTime());
      }
    }
  });
});
