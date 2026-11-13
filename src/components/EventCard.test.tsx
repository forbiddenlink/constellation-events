import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EventCard from "./EventCard";
import type { AstronomyEvent } from "@/lib/events";

describe("EventCard", () => {
  const mockEvent: AstronomyEvent = {
    id: "quadrantids-2026",
    title: "Quadrantids Meteor Shower",
    date: "2026-01-03",
    // EventCard recomputes the displayed date client-side, in the viewer's
    // own timezone, from `date` — dateDisplay (server-timezone-bound) is
    // only a fallback if `date` can't be parsed. Keep them intentionally
    // different here so the test proves that recomputation actually happens.
    dateDisplay: "SERVER-TIMEZONE-FALLBACK-UNUSED",
    summary: "First major meteor shower of the year with up to 120 meteors per hour",
    visibility: "excellent",
    visibilityScore: 90,
    type: "meteor",
    window: "2:00 AM - 5:00 AM",
    peak: "3:30 AM"
  };

  it("renders event title as a row heading", () => {
    render(<EventCard event={mockEvent} />);

    expect(screen.getByRole("heading", { name: "Quadrantids Meteor Shower" })).toBeInTheDocument();
  });

  it("displays the date computed from the viewer's own timezone, not the server-side dateDisplay", () => {
    render(<EventCard event={mockEvent} />);

    const expectedDate = new Date(mockEvent.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
    expect(screen.queryByText(mockEvent.dateDisplay)).not.toBeInTheDocument();
    expect(screen.getByText("excellent")).toBeInTheDocument();
  });

  it("shows best window and peak time", () => {
    render(<EventCard event={mockEvent} />);

    expect(screen.getByText(/Best window: 2:00 AM - 5:00 AM/)).toBeInTheDocument();
    expect(screen.getByText(/Peak: 3:30 AM/)).toBeInTheDocument();
  });

  it("renders as a ruled field-log row, not a lifted card", () => {
    const { container } = render(<EventCard event={mockEvent} />);

    const row = container.firstChild as HTMLElement;
    expect(row).toHaveClass("field-row");
    expect(row).not.toHaveClass("glass");
  });

  it("offers a quiet add-to-calendar link for dated events", () => {
    render(<EventCard event={mockEvent} />);

    expect(screen.getByRole("button", { name: /Add Quadrantids Meteor Shower to calendar/ })).toHaveClass("field-row-link");
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
