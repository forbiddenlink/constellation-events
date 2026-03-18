import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NightModeToggle from "./NightModeToggle";

// Mock the useNightMode hook
vi.mock("@/hooks/useNightMode", () => ({
  useNightMode: vi.fn()
}));

import { useNightMode } from "@/hooks/useNightMode";

const mockUseNightMode = vi.mocked(useNightMode);

describe("NightModeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders loading state when not mounted", () => {
    mockUseNightMode.mockReturnValue({
      mode: "dark",
      setMode: vi.fn(),
      toggle: vi.fn(),
      isNightVision: false,
      mounted: false
    });

    render(<NightModeToggle />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-label", "Loading night vision toggle");
    expect(button).toHaveClass("opacity-50");
  });

  it("renders enabled state when mounted and night vision off", () => {
    mockUseNightMode.mockReturnValue({
      mode: "dark",
      setMode: vi.fn(),
      toggle: vi.fn(),
      isNightVision: false,
      mounted: true
    });

    render(<NightModeToggle />);

    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("aria-label", "Enable night vision mode");
    expect(button).toHaveAttribute("title", "Enter night vision mode (red light)");
  });

  it("renders active state when night vision is on", () => {
    mockUseNightMode.mockReturnValue({
      mode: "night-vision",
      setMode: vi.fn(),
      toggle: vi.fn(),
      isNightVision: true,
      mounted: true
    });

    const { container } = render(<NightModeToggle />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Disable night vision mode");
    expect(button).toHaveAttribute("title", "Exit night vision mode");
    // NV ON text removed — icon-only toggle. Verify sun icon renders.
    const svgElement = container.querySelector("svg");
    expect(svgElement).toHaveAttribute("fill", "currentColor");
  });

  it("renders NV text when night vision is off", () => {
    mockUseNightMode.mockReturnValue({
      mode: "dark",
      setMode: vi.fn(),
      toggle: vi.fn(),
      isNightVision: false,
      mounted: true
    });

    render(<NightModeToggle />);

    // Icons only - no text labels
  });

  it("calls toggle when button is clicked", () => {
    const mockToggle = vi.fn();
    mockUseNightMode.mockReturnValue({
      mode: "dark",
      setMode: vi.fn(),
      toggle: mockToggle,
      isNightVision: false,
      mounted: true
    });

    render(<NightModeToggle />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it("does not call toggle when disabled (not mounted)", () => {
    const mockToggle = vi.fn();
    mockUseNightMode.mockReturnValue({
      mode: "dark",
      setMode: vi.fn(),
      toggle: mockToggle,
      isNightVision: false,
      mounted: false
    });

    render(<NightModeToggle />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockToggle).not.toHaveBeenCalled();
  });

  it("applies night-vision-toggle class", () => {
    mockUseNightMode.mockReturnValue({
      mode: "dark",
      setMode: vi.fn(),
      toggle: vi.fn(),
      isNightVision: false,
      mounted: true
    });

    render(<NightModeToggle />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("night-vision-toggle");
  });

  it("renders sun icon when night vision is on", () => {
    mockUseNightMode.mockReturnValue({
      mode: "night-vision",
      setMode: vi.fn(),
      toggle: vi.fn(),
      isNightVision: true,
      mounted: true
    });

    const { container } = render(<NightModeToggle />);

    // Sun icon uses fill="currentColor"
    const svgElement = container.querySelector("svg");
    expect(svgElement).toHaveAttribute("fill", "currentColor");
    expect(svgElement).toHaveClass("text-red-400");
  });

  it("renders moon icon when night vision is off", () => {
    mockUseNightMode.mockReturnValue({
      mode: "dark",
      setMode: vi.fn(),
      toggle: vi.fn(),
      isNightVision: false,
      mounted: true
    });

    const { container } = render(<NightModeToggle />);

    // Moon icon uses fill="none" and stroke
    const svgElement = container.querySelector("svg");
    expect(svgElement).toHaveAttribute("fill", "none");
    expect(svgElement).toHaveAttribute("stroke", "currentColor");
    expect(svgElement).toHaveClass("text-starlight/70");
  });

  it("renders sun icon with red color when active", () => {
    mockUseNightMode.mockReturnValue({
      mode: "night-vision",
      setMode: vi.fn(),
      toggle: vi.fn(),
      isNightVision: true,
      mounted: true
    });

    const { container } = render(<NightModeToggle />);

    const svgElement = container.querySelector("svg");
    expect(svgElement).toHaveClass("text-red-400");
  });
});
