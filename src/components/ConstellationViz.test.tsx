import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ConstellationViz from "./ConstellationViz";

describe("ConstellationViz", () => {
  it("renders the visualization container", () => {
    const { container } = render(<ConstellationViz />);

    const vizContainer = container.firstChild as HTMLElement;
    expect(vizContainer).toHaveClass("glass", "rounded-3xl", "p-6", "h-72");
  });

  it("renders the SVG element", () => {
    render(<ConstellationViz />);

    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 600 300");
  });

  it("has proper accessibility attributes on SVG", () => {
    render(<ConstellationViz />);

    const svg = document.querySelector("svg");
    expect(svg).toHaveAttribute("role", "img");
    expect(svg).toHaveAttribute("aria-label", "Decorative star pattern illustration");
  });

  it("renders constellation line path", () => {
    render(<ConstellationViz />);

    const pathElement = document.querySelector("path");
    expect(pathElement).toBeInTheDocument();
    expect(pathElement).toHaveAttribute("d", "M80 240 L140 170 L220 190 L280 130 L360 150 L430 110 L520 140");
  });

  it("renders main constellation stars (7 circles)", () => {
    render(<ConstellationViz />);

    // Main constellation stars with fill="#E8F1FF"
    const starGroup = document.querySelector('g[fill="#E8F1FF"]');
    expect(starGroup).toBeInTheDocument();

    const mainStars = starGroup?.querySelectorAll("circle");
    expect(mainStars).toHaveLength(7);
  });

  it("renders background stars (3 smaller circles)", () => {
    render(<ConstellationViz />);

    // Background stars with green tint
    const backgroundGroup = document.querySelector('g[fill="rgba(94,242,193,0.6)"]');
    expect(backgroundGroup).toBeInTheDocument();

    const backgroundStars = backgroundGroup?.querySelectorAll("circle");
    expect(backgroundStars).toHaveLength(3);
  });

  it("stars have varying sizes", () => {
    render(<ConstellationViz />);

    const allCircles = document.querySelectorAll("circle");
    const radii = Array.from(allCircles).map(c => c.getAttribute("r"));

    // Check that we have various star sizes
    expect(radii).toContain("3");
    expect(radii).toContain("4");
    expect(radii).toContain("5");
    expect(radii).toContain("6");
    expect(radii).toContain("2");
  });

  it("displays description text", () => {
    render(<ConstellationViz />);

    expect(screen.getByText(/Star pattern illustration/)).toBeInTheDocument();
  });

  it("applies gradient background styling", () => {
    const { container } = render(<ConstellationViz />);

    const backgroundDiv = container.querySelector(".absolute.inset-0");
    expect(backgroundDiv).toBeInTheDocument();
    expect(backgroundDiv?.className).toContain("bg-[radial-gradient");
  });

  it("has overflow hidden to clip content", () => {
    const { container } = render(<ConstellationViz />);

    const vizContainer = container.firstChild as HTMLElement;
    expect(vizContainer).toHaveClass("overflow-hidden");
  });

  it("positions SVG relatively", () => {
    render(<ConstellationViz />);

    const svg = document.querySelector("svg");
    expect(svg).toHaveClass("relative", "h-full", "w-full");
  });

  it("description text has proper styling", () => {
    render(<ConstellationViz />);

    const description = screen.getByText(/Star pattern illustration/).closest("div");
    expect(description).toHaveClass("relative", "mt-4", "text-xs", "text-starlight/40");
  });

  it("constellation line has proper stroke styling", () => {
    render(<ConstellationViz />);

    const strokeGroup = document.querySelector('g[stroke="rgba(232,241,255,0.45)"]');
    expect(strokeGroup).toBeInTheDocument();
    expect(strokeGroup).toHaveAttribute("stroke-width", "1.5");
  });
});
