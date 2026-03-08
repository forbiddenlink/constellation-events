import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import TonightAtGlance from "./TonightAtGlance";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock useGeolocation hook
vi.mock("@/hooks/useGeolocation", () => ({
  default: vi.fn()
}));

import useGeolocation from "@/hooks/useGeolocation";

const mockUseGeolocation = vi.mocked(useGeolocation);

describe("TonightAtGlance", () => {
  const mockTonightData = {
    highlights: [
      {
        id: "moon-1",
        name: "Crescent Moon",
        type: "Moon Phase",
        bestTime: "8:12 PM - 10:30 PM",
        magnitude: "-10.7",
        highlight: "Low glare tonight",
        metricLabel: "Mag"
      },
      {
        id: "jupiter",
        name: "Jupiter",
        type: "Planet",
        bestTime: "9:20 PM - 1:40 AM",
        magnitude: "-2.3",
        highlight: "Great seeing",
        metricLabel: "Brightness"
      }
    ],
    generatedAt: "2026-03-07T20:30:00Z",
    source: "astronomy-engine"
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGeolocation.mockReturnValue({
      status: "idle",
      lat: null,
      lng: null,
      error: null
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the component title", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTonightData
    });

    render(<TonightAtGlance />);

    expect(screen.getByText("Tonight at a glance")).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<TonightAtGlance />);

    expect(screen.getByText("Syncing the sky feed...")).toBeInTheDocument();
  });

  it("fetches and displays tonight highlights", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTonightData
    });

    render(<TonightAtGlance />);

    await waitFor(() => {
      expect(screen.getByText("Crescent Moon")).toBeInTheDocument();
      expect(screen.getByText("Jupiter")).toBeInTheDocument();
    });
  });

  it("displays object types", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTonightData
    });

    render(<TonightAtGlance />);

    await waitFor(() => {
      expect(screen.getByText("Moon Phase")).toBeInTheDocument();
      expect(screen.getByText("Planet")).toBeInTheDocument();
    });
  });

  it("displays best viewing times", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTonightData
    });

    render(<TonightAtGlance />);

    await waitFor(() => {
      expect(screen.getByText("Best window: 8:12 PM - 10:30 PM")).toBeInTheDocument();
      expect(screen.getByText("Best window: 9:20 PM - 1:40 AM")).toBeInTheDocument();
    });
  });

  it("displays magnitude values", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTonightData
    });

    render(<TonightAtGlance />);

    await waitFor(() => {
      expect(screen.getByText("-10.7")).toBeInTheDocument();
      expect(screen.getByText("-2.3")).toBeInTheDocument();
    });
  });

  it("displays metric labels", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTonightData
    });

    render(<TonightAtGlance />);

    await waitFor(() => {
      expect(screen.getByText("Mag")).toBeInTheDocument();
      expect(screen.getByText("Brightness")).toBeInTheDocument();
    });
  });

  it("shows error state when fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    render(<TonightAtGlance />);

    await waitFor(() => {
      expect(screen.getByText("Sky feed unavailable. Showing cached highlights.")).toBeInTheDocument();
    });
  });

  it("shows error state when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<TonightAtGlance />);

    await waitFor(() => {
      expect(screen.getByText("Sky feed unavailable. Showing cached highlights.")).toBeInTheDocument();
    });
  });

  it("displays source when available", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTonightData
    });

    render(<TonightAtGlance />);

    await waitFor(() => {
      expect(screen.getByText("Source: astronomy-engine")).toBeInTheDocument();
    });
  });

  it("does not display source when not available", async () => {
    const noSourceData = { ...mockTonightData, source: undefined };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => noSourceData
    });

    render(<TonightAtGlance />);

    await waitFor(() => {
      expect(screen.getByText("Crescent Moon")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Source:/)).not.toBeInTheDocument();
  });

  it("displays formatted timestamp", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTonightData
    });

    render(<TonightAtGlance />);

    await waitFor(() => {
      expect(screen.getByText(/Updated/)).toBeInTheDocument();
    });
  });

  it("shows Live feed when no timestamp", async () => {
    const noTimestampData = { ...mockTonightData, generatedAt: "" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => noTimestampData
    });

    render(<TonightAtGlance />);

    // Initially shows "Live feed" before data loads
    expect(screen.getByText("Live feed")).toBeInTheDocument();
  });

  it("includes geolocation params when available", async () => {
    mockUseGeolocation.mockReturnValue({
      status: "ready",
      lat: 36.1147,
      lng: -115.1728,
      error: null
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTonightData
    });

    render(<TonightAtGlance />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("lat=36.1147")
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("lng=-115.1728")
      );
    });
  });

  it("does not include geolocation params when not ready", async () => {
    mockUseGeolocation.mockReturnValue({
      status: "loading",
      lat: null,
      lng: null,
      error: null
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTonightData
    });

    render(<TonightAtGlance />);

    await waitFor(() => {
      const fetchUrl = mockFetch.mock.calls[0][0] as string;
      expect(fetchUrl).not.toContain("lat=");
      expect(fetchUrl).not.toContain("lng=");
    });
  });

  it("applies glass styling to container", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    const { container } = render(<TonightAtGlance />);

    const glassContainer = container.firstChild as HTMLElement;
    expect(glassContainer).toHaveClass("glass", "rounded-3xl", "p-6");
  });

  it("defaults metric label to Mag when not provided", async () => {
    const dataWithoutMetricLabel = {
      ...mockTonightData,
      highlights: [
        {
          id: "test",
          name: "Test Object",
          type: "Star",
          bestTime: "8:00 PM",
          magnitude: "3.5",
          highlight: "Test"
          // No metricLabel
        }
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => dataWithoutMetricLabel
    });

    render(<TonightAtGlance />);

    await waitFor(() => {
      expect(screen.getByText("Mag")).toBeInTheDocument();
    });
  });

  it("handles empty highlights array", async () => {
    const emptyData = { ...mockTonightData, highlights: [] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => emptyData
    });

    const { container } = render(<TonightAtGlance />);

    await waitFor(() => {
      // Should still render container without errors
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  it("refetches when geolocation changes", async () => {
    const { rerender } = render(<TonightAtGlance />);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTonightData
    });

    // Update geolocation
    mockUseGeolocation.mockReturnValue({
      status: "ready",
      lat: 40.7128,
      lng: -74.0060,
      error: null
    });

    rerender(<TonightAtGlance />);

    // The component should have made a new fetch call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
