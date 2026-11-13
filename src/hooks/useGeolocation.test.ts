import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { coarsenCoordinate, setManualLocation } from "./useGeolocation";

describe("coarsenCoordinate", () => {
  it("rounds to two decimal places (about 1 km)", () => {
    expect(coarsenCoordinate(40.712776)).toBe(40.71);
    expect(coarsenCoordinate(-74.005974)).toBe(-74.01);
    expect(coarsenCoordinate(0)).toBe(0);
  });
});

describe("saved location", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it("persists only the coarse position, never the precise one", () => {
    setManualLocation(40.712776, -74.005974);
    const saved = JSON.parse(window.localStorage.getItem("constellation.location") ?? "{}");
    expect(saved).toEqual({ lat: 40.71, lng: -74.01 });
  });
});
