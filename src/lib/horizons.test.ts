import { describe, it, expect } from "vitest";
import { parseHorizonsTimeLabel } from "./horizons";

describe("parseHorizonsTimeLabel", () => {
  it("converts a JPL Horizons UT label into an unambiguous ISO UTC string", () => {
    expect(parseHorizonsTimeLabel("2026-Sep-27 16:57")).toBe("2026-09-27T16:57:00.000Z");
  });

  it("does not shift the time by the host's local timezone offset", () => {
    // Regression: `new Date("2026-Sep-27 16:57")` parses as LOCAL time in V8,
    // which silently misrepresents a UT timestamp from JPL Horizons.
    const iso = parseHorizonsTimeLabel("2026-Jan-01 00:30");
    expect(iso).toBe("2026-01-01T00:30:00.000Z");
    expect(new Date(iso!).getUTCHours()).toBe(0);
    expect(new Date(iso!).getUTCMinutes()).toBe(30);
  });

  it("pads single-digit days correctly and handles every month abbreviation", () => {
    expect(parseHorizonsTimeLabel("2026-Dec-05 09:00")).toBe("2026-12-05T09:00:00.000Z");
    expect(parseHorizonsTimeLabel("2026-Mar-31 23:59")).toBe("2026-03-31T23:59:00.000Z");
  });

  it("returns null for unrecognized formats instead of guessing", () => {
    expect(parseHorizonsTimeLabel("")).toBeNull();
    expect(parseHorizonsTimeLabel("not a date")).toBeNull();
    expect(parseHorizonsTimeLabel("2026-13-27 16:57")).toBeNull();
  });
});
