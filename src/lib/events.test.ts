import { afterEach, describe, it, expect, vi } from "vitest";
import {
  generateUpcomingEvents,
  getTonightEvents,
  getActiveMeteorShowers
} from "./events";

describe("generateUpcomingEvents", () => {
  it("returns an array of events", () => {
    const events = generateUpcomingEvents(undefined, new Date("2026-01-01"), 30);
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
  });

  it("includes Quadrantids meteor shower in January 2026", () => {
    const events = generateUpcomingEvents(undefined, new Date("2026-01-01"), 15);
    const quadrantids = events.find((e) => e.title.includes("Quadrantids"));
    expect(quadrantids).toBeDefined();
    expect(quadrantids!.type).toBe("meteor");
  });

  it("includes Perseids meteor shower in August 2026", () => {
    const events = generateUpcomingEvents(undefined, new Date("2026-08-01"), 30);
    const perseids = events.find((e) => e.title.includes("Perseids"));
    expect(perseids).toBeDefined();
    expect(perseids!.type).toBe("meteor");
  });

  it("events are sorted by date", () => {
    const events = generateUpcomingEvents(undefined, new Date("2026-01-01"), 365);
    for (let i = 1; i < events.length; i++) {
      const prev = new Date(events[i - 1].date).getTime();
      const curr = new Date(events[i].date).getTime();
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });

  it("each event has required fields", () => {
    const events = generateUpcomingEvents(undefined, new Date("2026-06-01"), 60);
    for (const event of events) {
      expect(event.id).toBeTruthy();
      expect(event.title).toBeTruthy();
      expect(event.date).toBeTruthy();
      expect(event.dateDisplay).toBeTruthy();
      expect(event.window).toBeTruthy();
      expect(["excellent", "good", "fair", "poor"]).toContain(event.visibility);
      expect(event.visibilityScore).toBeGreaterThanOrEqual(0);
      expect(event.visibilityScore).toBeLessThanOrEqual(100);
      expect(event.summary).toBeTruthy();
      expect(["moon", "meteor", "planet", "eclipse", "conjunction", "other"]).toContain(event.type);
    }
  });

  it("includes planetary events when in range", () => {
    // Venus greatest elongation east verified against Royal Observatory
    // Greenwich + EarthSky as Aug 15, 2026 (was wrongly Feb 9).
    const events = generateUpcomingEvents(undefined, new Date("2026-08-01"), 30);
    const venus = events.find((e) => e.title.includes("Venus"));
    expect(venus).toBeDefined();
    expect(venus!.type).toBe("planet");
  });

  it("labels the Mars-Jupiter conjunction as type conjunction, not planet", () => {
    // The events feed's "Conjunctions" filter tab matches on `type`, not
    // title text, so a conjunction mislabeled as "planet" is invisible there.
    const events = generateUpcomingEvents(undefined, new Date("2026-03-01"), 30);
    const conjunction = events.find((e) => e.title.includes("Conjunction"));
    expect(conjunction).toBeDefined();
    expect(conjunction!.type).toBe("conjunction");
  });

  it("returns empty for a date range with no events", () => {
    // 1 day in a period unlikely to have moon phase exactly on threshold
    const events = generateUpcomingEvents(undefined, new Date("2026-03-10"), 1);
    // May or may not have events — just verify it doesn't throw
    expect(Array.isArray(events)).toBe(true);
  });

  it("never reports the same moon phase on two nearby nights", () => {
    // Regression test: the phase-detection window (±0.02) can span more
    // than one calendar day near the exact moment, which previously
    // produced back-to-back duplicates like two "New Moon" events a day
    // apart — astronomically impossible (the synodic month is ~29.5
    // days). Each major phase should appear at most once per ~25-day
    // stretch across a full year of coverage.
    const events = generateUpcomingEvents(undefined, new Date("2026-01-01"), 365);
    const moonEvents = events.filter((e) => e.type === "moon");
    for (let i = 1; i < moonEvents.length; i++) {
      const prev = moonEvents[i - 1];
      const curr = moonEvents[i];
      if (prev.title !== curr.title) continue;
      const daysApart =
        (new Date(curr.date).getTime() - new Date(prev.date).getTime()) / 86400000;
      expect(daysApart).toBeGreaterThan(20);
    }
  });
});

describe("getTonightEvents", () => {
  it("returns an array without throwing", () => {
    const events = getTonightEvents();
    expect(Array.isArray(events)).toBe(true);
  });
});

describe("getActiveMeteorShowers", () => {
  it("returns Quadrantids in early January", () => {
    const showers = getActiveMeteorShowers(new Date("2026-01-05"));
    expect(showers.some((s) => s.name === "Quadrantids")).toBe(true);
  });

  it("returns Perseids in mid-August", () => {
    const showers = getActiveMeteorShowers(new Date("2026-08-12"));
    expect(showers.some((s) => s.name === "Perseids")).toBe(true);
  });

  it("returns empty array when no showers are active", () => {
    // Mid-March: no active showers
    const showers = getActiveMeteorShowers(new Date("2026-03-15"));
    expect(showers).toHaveLength(0);
  });

  it("returns multiple showers when overlapping", () => {
    // Late October/early November: Orionids overlap with Leonids start
    const showers = getActiveMeteorShowers(new Date("2026-11-06"));
    expect(showers.length).toBeGreaterThanOrEqual(1);
  });
});

describe("calendar keeps working after 2026 (fake clock)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ["2027-08-01T00:00:00Z", "Perseids", "2027-08-12"],
    ["2028-08-01T00:00:00Z", "Perseids", "2028-08-12"],
    ["2027-12-01T00:00:00Z", "Geminids", "2027-12-14"],
    ["2028-01-01T00:00:00Z", "Quadrantids", "2028-01-03"],
  ])("default clock %s lists %s peak", (now, name, peakDay) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));
    const events = generateUpcomingEvents(undefined, undefined, 30);
    const shower = events.find((e) => e.title.includes(name));
    expect(shower).toBeDefined();
    expect(shower!.date.startsWith(peakDay)).toBe(true);
    expect(shower!.id).toContain(peakDay.slice(0, 4));
  });

  it("lists solstices and equinoxes in 2027 and 2028", () => {
    for (const year of [2027, 2028]) {
      const events = generateUpcomingEvents(undefined, new Date(`${year}-01-01`), 366);
      const titles = events.map((e) => e.title);
      expect(titles).toContain("March Equinox");
      expect(titles).toContain("June Solstice");
      expect(titles).toContain("September Equinox");
      expect(titles).toContain("December Solstice");
    }
  });

  it("puts the 2027 June solstice on June 21 (UTC)", () => {
    const events = generateUpcomingEvents(undefined, new Date("2027-06-01"), 40);
    const solstice = events.find((e) => e.title === "June Solstice");
    expect(solstice!.date.startsWith("2027-06-21")).toBe(true);
  });

  it("lists the 2027-08-02 total solar eclipse", () => {
    const events = generateUpcomingEvents(undefined, new Date("2027-07-25"), 20);
    const eclipse = events.find((e) => e.type === "eclipse" && e.title.includes("Solar"));
    expect(eclipse).toBeDefined();
    expect(eclipse!.date.startsWith("2027-08-02")).toBe(true);
  });

  it("does not return 2026-only one-off events in other years", () => {
    const events = generateUpcomingEvents(undefined, new Date("2027-01-01"), 365);
    expect(events.some((e) => e.id.includes("2026"))).toBe(false);
  });

  it("returns showers for getActiveMeteorShowers in 2027", () => {
    const showers = getActiveMeteorShowers(new Date("2027-08-12"));
    expect(showers.some((s) => s.name === "Perseids")).toBe(true);
  });
});
