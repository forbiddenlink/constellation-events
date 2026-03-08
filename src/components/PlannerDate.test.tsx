import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import PlannerDate from "./PlannerDate";

describe("PlannerDate", () => {
  const originalDate = Date;

  beforeEach(() => {
    // Mock Date to return a consistent date
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-07T20:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders Tonight prefix", () => {
    render(<PlannerDate />);

    expect(screen.getByText(/Tonight,/)).toBeInTheDocument();
  });

  it("displays formatted date", () => {
    render(<PlannerDate />);

    // The date format depends on locale, but should include month, day, year
    const element = screen.getByText(/Tonight,/);
    expect(element.textContent).toContain("Tonight,");
  });

  it("renders as a span element", () => {
    const { container } = render(<PlannerDate />);

    const span = container.querySelector("span");
    expect(span).toBeInTheDocument();
  });

  it("includes month in date display", () => {
    render(<PlannerDate />);

    // Check for month - toLocaleDateString with { month: "short" } gives short month name
    const element = screen.getByText(/Tonight,/);
    // Mar is the short form for March
    expect(element.textContent).toMatch(/Mar|March/i);
  });

  it("includes day number in date display", () => {
    render(<PlannerDate />);

    const element = screen.getByText(/Tonight,/);
    // Should include the day number (7)
    expect(element.textContent).toContain("7");
  });

  it("includes year in date display", () => {
    render(<PlannerDate />);

    const element = screen.getByText(/Tonight,/);
    // Should include the year
    expect(element.textContent).toContain("2026");
  });

  it("updates when date changes", () => {
    const { rerender } = render(<PlannerDate />);

    // Change the system time
    vi.setSystemTime(new Date("2026-12-25T20:00:00"));

    // Re-render the component
    rerender(<PlannerDate />);

    const element = screen.getByText(/Tonight,/);
    // December 25, 2026 should be displayed
    expect(element.textContent).toMatch(/Dec|December/i);
    expect(element.textContent).toContain("25");
  });

  it("handles different locales gracefully", () => {
    // The component uses undefined locale which defaults to system locale
    // Just verify it doesn't throw
    expect(() => render(<PlannerDate />)).not.toThrow();
  });

  it("renders correct date format for January 1st", () => {
    vi.setSystemTime(new Date("2026-01-01T12:00:00"));

    render(<PlannerDate />);

    const element = screen.getByText(/Tonight,/);
    expect(element.textContent).toMatch(/Jan|January/i);
    expect(element.textContent).toContain("1");
    expect(element.textContent).toContain("2026");
  });

  it("renders correct date format for December 31st", () => {
    vi.setSystemTime(new Date("2026-12-31T23:59:59"));

    render(<PlannerDate />);

    const element = screen.getByText(/Tonight,/);
    expect(element.textContent).toMatch(/Dec|December/i);
    expect(element.textContent).toContain("31");
    expect(element.textContent).toContain("2026");
  });

  it("handles leap year date", () => {
    // 2028 is a leap year
    vi.setSystemTime(new Date("2028-02-29T12:00:00"));

    render(<PlannerDate />);

    const element = screen.getByText(/Tonight,/);
    expect(element.textContent).toMatch(/Feb|February/i);
    expect(element.textContent).toContain("29");
    expect(element.textContent).toContain("2028");
  });
});
