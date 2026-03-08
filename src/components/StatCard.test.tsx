import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatCard from "./StatCard";

describe("StatCard", () => {
  it("renders label, value, and detail", () => {
    render(<StatCard label="Moon Phase" value="Waxing Gibbous" detail="82% illumination" />);

    expect(screen.getByText("Moon Phase")).toBeInTheDocument();
    expect(screen.getByText("Waxing Gibbous")).toBeInTheDocument();
    expect(screen.getByText("82% illumination")).toBeInTheDocument();
  });

  it("applies glass styling", () => {
    const { container } = render(
      <StatCard label="Test" value="Value" detail="Detail" />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("glass", "rounded-2xl");
  });

  it("uses correct typography hierarchy", () => {
    render(<StatCard label="Label" value="Value" detail="Detail" />);

    // Label should be uppercase with tracking
    const label = screen.getByText("Label");
    expect(label).toHaveClass("uppercase", "tracking-[0.3em]");

    // Value should be larger and semibold
    const value = screen.getByText("Value");
    expect(value).toHaveClass("text-2xl", "font-semibold");
  });
});
