import { describe, it, expect } from "vitest";
import { parseCoordinates, clamp } from "./geo";

describe("parseCoordinates", () => {
  it("returns coordinates for valid lat/lng strings", () => {
    expect(parseCoordinates("36.1147", "-115.1728")).toEqual({
      lat: 36.1147,
      lng: -115.1728
    });
  });

  it("returns null when lat is missing", () => {
    expect(parseCoordinates(null, "-115.1728")).toBeNull();
    expect(parseCoordinates(undefined, "-115.1728")).toBeNull();
    expect(parseCoordinates("", "-115.1728")).toBeNull();
  });

  it("returns null when lng is missing", () => {
    expect(parseCoordinates("36.1147", null)).toBeNull();
    expect(parseCoordinates("36.1147", undefined)).toBeNull();
    expect(parseCoordinates("36.1147", "")).toBeNull();
  });

  it("returns null for non-numeric strings", () => {
    expect(parseCoordinates("abc", "def")).toBeNull();
    expect(parseCoordinates("36.1147", "xyz")).toBeNull();
  });

  it("rejects lat outside -90 to 90 range", () => {
    expect(parseCoordinates("91", "0")).toBeNull();
    expect(parseCoordinates("-91", "0")).toBeNull();
  });

  it("rejects lng outside -180 to 180 range", () => {
    expect(parseCoordinates("0", "181")).toBeNull();
    expect(parseCoordinates("0", "-181")).toBeNull();
  });

  it("accepts boundary values", () => {
    expect(parseCoordinates("90", "180")).toEqual({ lat: 90, lng: 180 });
    expect(parseCoordinates("-90", "-180")).toEqual({ lat: -90, lng: -180 });
    expect(parseCoordinates("0", "0")).toEqual({ lat: 0, lng: 0 });
  });
});

describe("clamp", () => {
  it("returns the value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to min when value is below range", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("clamps to max when value is above range", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("handles equal min and max", () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });

  it("returns boundary values exactly", () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});
