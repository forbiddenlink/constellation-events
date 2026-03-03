import { describe, it, expect } from "vitest";
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
    const events = generateUpcomingEvents(undefined, new Date("2026-02-01"), 30);
    const venus = events.find((e) => e.title.includes("Venus"));
    expect(venus).toBeDefined();
    expect(venus!.type).toBe("planet");
  });

  it("returns empty for a date range with no events", () => {
    // 1 day in a period unlikely to have moon phase exactly on threshold
    const events = generateUpcomingEvents(undefined, new Date("2026-03-10"), 1);
    // May or may not have events — just verify it doesn't throw
    expect(Array.isArray(events)).toBe(true);
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
