import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LocationCard from "./LocationCard";
import type { LocationItem } from "@/lib/mock";
import type { DarkSkyLocation } from "@/lib/locations";

describe("LocationCard", () => {
  const mockLocationItem: LocationItem = {
    id: "loc-1",
    name: "Sierra Vista Overlook",
    distance: "42 mi",
    darkSkyScore: 92,
    bestWindow: "9:00 PM - 2:00 AM",
    note: "Clear horizon; low humidity."
  };

  const mockDarkSkyLocation: DarkSkyLocation = {
    id: "desert-springs",
    name: "Desert Springs Observatory",
    coordinates: { lat: 36.0, lng: -115.5 },
    distance: 88.5,
    distanceDisplay: "55 mi",
    darkSkyScore: 95,
    bortleClass: 2,
    elevation: 1500,
    description: "Excellent dark sky preserve with minimal light pollution.",
    amenities: ["parking", "restrooms"],
    bestWindow: "8:00 PM - 4:00 AM",
    accessibility: "easy",
    type: "reserve"
  };

  it("renders location name", () => {
    render(<LocationCard location={mockLocationItem} />);

    expect(screen.getByText("Sierra Vista Overlook")).toBeInTheDocument();
  });

  it("renders distance with LocationItem format", () => {
    render(<LocationCard location={mockLocationItem} />);

    expect(screen.getByText("42 mi away")).toBeInTheDocument();
  });

  it("renders distance with DarkSkyLocation format", () => {
    render(<LocationCard location={mockDarkSkyLocation} />);

    expect(screen.getByText("55 mi away")).toBeInTheDocument();
  });

  it("renders dark sky score", () => {
    render(<LocationCard location={mockLocationItem} />);

    expect(screen.getByText("92")).toBeInTheDocument();
    expect(screen.getByText("/100")).toBeInTheDocument();
  });

  it("renders description/note for LocationItem", () => {
    render(<LocationCard location={mockLocationItem} />);

    expect(screen.getByText("Clear horizon; low humidity.")).toBeInTheDocument();
  });

  it("renders description for DarkSkyLocation", () => {
    render(<LocationCard location={mockDarkSkyLocation} />);

    expect(screen.getByText("Excellent dark sky preserve with minimal light pollution.")).toBeInTheDocument();
  });

  it("renders best viewing window", () => {
    render(<LocationCard location={mockLocationItem} />);

    expect(screen.getByText(/Best viewing: 9:00 PM - 2:00 AM/)).toBeInTheDocument();
  });

  it("renders as a ruled row without a repeated thumbnail", () => {
    const { container } = render(<LocationCard location={mockLocationItem} />);

    const row = container.firstChild as HTMLElement;
    expect(row).toHaveClass("field-row");
    expect(container.querySelector("svg")).toBeNull();
  });

  it("renders location name as a heading", () => {
    render(<LocationCard location={mockLocationItem} />);

    expect(screen.getByRole("heading", { name: "Sierra Vista Overlook" })).toBeInTheDocument();
  });
});
