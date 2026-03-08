import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EventCard from "./EventCard";
import type { AstronomyEvent } from "@/lib/events";

describe("EventCard", () => {
  const mockEvent: AstronomyEvent = {
    id: "quadrantids-2026",
    title: "Quadrantids Meteor Shower",
    date: "2026-01-03",
    dateDisplay: "Jan 3-4",
    summary: "First major meteor shower of the year with up to 120 meteors per hour",
    visibility: "excellent",
    visibilityScore: 90,
    type: "meteor",
    window: "2:00 AM - 5:00 AM",
    peak: "3:30 AM"
  };

  it("renders event title and summary", () => {
    render(<EventCard event={mockEvent} />);

    expect(screen.getByText("Quadrantids Meteor Shower")).toBeInTheDocument();
    expect(screen.getByText(/First major meteor shower/)).toBeInTheDocument();
  });

  it("displays date and visibility badge", () => {
    render(<EventCard event={mockEvent} />);

    expect(screen.getByText("Jan 3-4")).toBeInTheDocument();
    expect(screen.getByText("excellent")).toBeInTheDocument();
  });

  it("shows best window and peak time", () => {
    render(<EventCard event={mockEvent} />);

    expect(screen.getByText(/Best window: 2:00 AM - 5:00 AM/)).toBeInTheDocument();
    expect(screen.getByText(/Peak: 3:30 AM/)).toBeInTheDocument();
  });

  it("applies aurora color for excellent visibility", () => {
    render(<EventCard event={mockEvent} />);

    const badge = screen.getByText("excellent");
    expect(badge).toHaveClass("text-aurora", "border-aurora/30");
  });

  it("applies starlight color for good visibility", () => {
    const goodEvent = { ...mockEvent, visibility: "good" as const };
    render(<EventCard event={goodEvent} />);

    const badge = screen.getByText("good");
    expect(badge).toHaveClass("text-starlight", "border-starlight/30");
  });

  it("applies yellow color for fair visibility", () => {
    const fairEvent = { ...mockEvent, visibility: "fair" as const };
    render(<EventCard event={fairEvent} />);

    const badge = screen.getByText("fair");
    expect(badge).toHaveClass("text-yellow-400", "border-yellow-400/30");
  });

  it("applies ember color for poor visibility", () => {
    const poorEvent = { ...mockEvent, visibility: "poor" as const };
    render(<EventCard event={poorEvent} />);

    const badge = screen.getByText("poor");
    expect(badge).toHaveClass("text-ember", "border-ember/30");
  });

  it("has hover animation classes", () => {
    const { container } = render(<EventCard event={mockEvent} />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("hover:-translate-y-1", "hover:shadow-comet");
  });

  it("handles legacy EventItem format", () => {
    const legacyEvent = {
      id: "legacy-event",
      title: "Legacy Event",
      date: "March 15",
      summary: "A legacy format event",
      visibility: "Good",
      window: "8:00 PM - 10:00 PM"
    };

    render(<EventCard event={legacyEvent} />);

    expect(screen.getByText("Legacy Event")).toBeInTheDocument();
    expect(screen.getByText("March 15")).toBeInTheDocument();
  });
});
