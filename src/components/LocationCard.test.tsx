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
    expect(screen.getByText("Score")).toBeInTheDocument();
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

  it("applies glass styling to card", () => {
    const { container } = render(<LocationCard location={mockLocationItem} />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("glass", "rounded-2xl", "p-5");
  });

  it("renders location name with correct styling", () => {
    render(<LocationCard location={mockLocationItem} />);

    const name = screen.getByText("Sierra Vista Overlook");
    expect(name).toHaveClass("text-lg", "font-semibold", "text-starlight");
  });

  it("renders dark sky score with aurora color", () => {
    render(<LocationCard location={mockLocationItem} />);

    const score = screen.getByText("92");
    expect(score).toHaveClass("text-2xl", "font-semibold", "text-aurora");
  });

  it("renders distance with subtle styling", () => {
    render(<LocationCard location={mockLocationItem} />);

    const distance = screen.getByText("42 mi away");
    expect(distance).toHaveClass("text-xs", "text-starlight/50");
  });

  it("renders score label with uppercase tracking", () => {
    render(<LocationCard location={mockLocationItem} />);

    const scoreLabel = screen.getByText("Score");
    expect(scoreLabel).toHaveClass("uppercase", "tracking-[0.3em]");
  });
});
