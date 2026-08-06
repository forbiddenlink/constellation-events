import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ConstellationViz from "./ConstellationViz";
import type { AstronomyEvent } from "@/lib/events";

const mockEvents: AstronomyEvent[] = [
  {
    id: "meteor-perseids-2026",
    title: "Perseids Meteor Shower",
    date: "2026-08-12T00:00:00.000Z",
    dateDisplay: "Aug 12",
    window: "10:00 PM – 4:00 AM",
    visibility: "excellent",
    visibilityScore: 90,
    summary: "Peak rate: 100 meteors/hour.",
    type: "meteor",
  },
  {
    id: "moon-2026-08-20",
    title: "New Moon",
    date: "2026-08-20T00:00:00.000Z",
    dateDisplay: "Aug 20",
    window: "All night",
    visibility: "excellent",
    visibilityScore: 95,
    summary: "Ideal for deep-sky observation.",
    type: "moon",
  },
  {
    id: "planet-2026-09-22",
    title: "Jupiter at Opposition",
    date: "2026-09-22T00:00:00.000Z",
    dateDisplay: "Sep 22",
    window: "Dusk – Dawn",
    visibility: "excellent",
    visibilityScore: 40,
    summary: "Jupiter at closest approach.",
    type: "planet",
  },
];

describe("ConstellationViz", () => {
  it("renders the visualization container", () => {
    const { container } = render(<ConstellationViz events={mockEvents} />);
    const vizContainer = container.firstChild as HTMLElement;
    expect(vizContainer).toHaveClass("glass", "rounded-3xl", "p-6", "h-72");
  });

  it("renders the SVG element with correct viewBox", () => {
    render(<ConstellationViz events={mockEvents} />);
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 600 300");
  });

  it("has a descriptive accessible label reflecting event count", () => {
    render(<ConstellationViz events={mockEvents} />);
    const svg = document.querySelector("svg");
    expect(svg).toHaveAttribute("role", "img");
    expect(svg?.getAttribute("aria-label")).toContain("3 upcoming celestial events");
  });

  it("plots one star node group per event", () => {
    render(<ConstellationViz events={mockEvents} />);
    // Each event renders a <g> with a core circle carrying a <title>.
    const titles = document.querySelectorAll("circle > title");
    expect(titles).toHaveLength(mockEvents.length);
  });

  it("connects events with a timeline polyline", () => {
    render(<ConstellationViz events={mockEvents} />);
    const polyline = document.querySelector("polyline");
    expect(polyline).toBeInTheDocument();
    // 3 points => 3 coordinate pairs
    expect(polyline?.getAttribute("points")?.trim().split(" ")).toHaveLength(3);
  });

  it("sizes stars by visibility score (higher score => larger radius)", () => {
    render(<ConstellationViz events={mockEvents} />);
    // Core circles (those with a <title> child).
    const cores = Array.from(document.querySelectorAll("circle")).filter((c) =>
      c.querySelector("title"),
    );
    const radii = cores.map((c) => Number(c.getAttribute("r")));
    // New Moon (95) should be larger than Jupiter (40).
    expect(Math.max(...radii)).toBeGreaterThan(Math.min(...radii));
  });

  it("shows the event title on hover", () => {
    render(<ConstellationViz events={mockEvents} />);
    const firstGroup = document.querySelector("svg g");
    expect(firstGroup).toBeInTheDocument();
    fireEvent.mouseEnter(firstGroup as Element);
    expect(screen.getAllByText("Perseids Meteor Shower").length).toBeGreaterThan(0);
  });

  it("gates twinkle animation for reduced motion", () => {
    render(<ConstellationViz events={mockEvents} />);
    const halo = document.querySelector("circle.animate-pulseSoft");
    expect(halo).toBeInTheDocument();
    expect(halo?.getAttribute("class")).toContain("motion-reduce:animate-none");
  });

  it("renders an empty state when no events are provided", () => {
    render(<ConstellationViz events={[]} />);
    expect(screen.getByText(/No upcoming events plotted/)).toBeInTheDocument();
    expect(document.querySelector("polyline")).not.toBeInTheDocument();
  });
});
