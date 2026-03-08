import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock useGeolocation hook
vi.mock("@/hooks/useGeolocation", () => ({
  default: vi.fn()
}));

// Mock next/dynamic to render StarMap synchronously
vi.mock("next/dynamic", () => ({
  default: () => {
    // Return a mock component
    return function MockStarMap({ showLightPollution, overlayOpacity }: { showLightPollution: boolean; overlayOpacity: number }) {
      return (
        <div data-testid="star-map" data-light-pollution={String(showLightPollution)} data-opacity={overlayOpacity}>
          Mock Star Map
        </div>
      );
    };
  }
}));

import useGeolocation from "@/hooks/useGeolocation";
import LocationsMapPanel from "./LocationsMapPanel";

const mockUseGeolocation = vi.mocked(useGeolocation);

describe("LocationsMapPanel", () => {
  const mockLocationStats = {
    userDarkSkyScore: 68,
    conditions: {
      moonIllumination: 45,
      cloudCover: 20,
      weatherQuality: 78,
      weatherSource: "openweather"
    }
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

  it("renders the panel title", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<LocationsMapPanel />);

    expect(screen.getByText("Sky quality map")).toBeInTheDocument();
  });

  it("renders the panel description", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<LocationsMapPanel />);

    expect(screen.getByText(/Toggle layers to compare light pollution/)).toBeInTheDocument();
  });

  it("renders the StarMap component", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<LocationsMapPanel />);

    expect(screen.getByTestId("star-map")).toBeInTheDocument();
  });

  it("renders layer toggle buttons", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<LocationsMapPanel />);

    expect(screen.getByText("Light pollution")).toBeInTheDocument();
    // Clouds and Moon are stats labels, not separate toggle buttons in this component
  });

  it("toggles light pollution layer when clicked", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<LocationsMapPanel />);

    const toggleButton = screen.getByText("Light pollution");

    // Initially active (border-aurora)
    expect(toggleButton.className).toContain("border-aurora");
    expect(toggleButton.className).toContain("text-aurora");

    fireEvent.click(toggleButton);

    // After click, should be inactive
    expect(toggleButton.className).toContain("border-white/20");
    expect(toggleButton.className).toContain("text-starlight/60");
  });

  it("renders light pollution intensity slider", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<LocationsMapPanel />);

    expect(screen.getByText("Light pollution intensity")).toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("updates opacity when slider changes", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<LocationsMapPanel />);

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "50" } });

    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("passes light pollution state to StarMap", async () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<LocationsMapPanel />);

    await waitFor(() => {
      const starMap = screen.getByTestId("star-map");
      expect(starMap).toHaveAttribute("data-light-pollution", "true");
    });
  });

  it("passes opacity to StarMap", async () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<LocationsMapPanel />);

    await waitFor(() => {
      const starMap = screen.getByTestId("star-map");
      expect(starMap).toHaveAttribute("data-opacity", "0.7");
    });
  });

  it("fetches and displays location stats", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLocationStats
    });

    render(<LocationsMapPanel />);

    await waitFor(() => {
      expect(screen.getByText("20%")).toBeInTheDocument(); // Cloud cover
    });
  });

  it("displays Bortle class estimate", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLocationStats
    });

    render(<LocationsMapPanel />);

    await waitFor(() => {
      expect(screen.getByText("Bortle")).toBeInTheDocument();
      // Bortle = 9 - (68 / 12) = 9 - 5.67 = 3.33 -> 3
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  it("displays moon illumination", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLocationStats
    });

    render(<LocationsMapPanel />);

    await waitFor(() => {
      // Find the stat box for Moon with value 45%
      expect(screen.getByText("45%")).toBeInTheDocument();
    });
  });

  it("displays weather quality score", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLocationStats
    });

    render(<LocationsMapPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Weather quality score 78/)).toBeInTheDocument();
    });
  });

  it("displays weather source", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLocationStats
    });

    render(<LocationsMapPanel />);

    await waitFor(() => {
      expect(screen.getByText(/via openweather/)).toBeInTheDocument();
    });
  });

  it("shows n/a values when stats are unavailable", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<LocationsMapPanel />);

    // Stats boxes should show n/a before data loads
    const naValues = screen.getAllByText("n/a");
    expect(naValues.length).toBeGreaterThanOrEqual(3);
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
      json: async () => mockLocationStats
    });

    render(<LocationsMapPanel />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("lat=36.1147"),
        expect.any(Object)
      );
    });
  });

  it("adds limit=1 to fetch query", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLocationStats
    });

    render(<LocationsMapPanel />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=1"),
        expect.any(Object)
      );
    });
  });

  it("applies glass styling to container", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    const { container } = render(<LocationsMapPanel />);

    const glassContainer = container.querySelector(".glass.rounded-3xl.p-6");
    expect(glassContainer).toBeInTheDocument();
  });

  it("renders env var instruction text", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<LocationsMapPanel />);

    expect(screen.getByText(/Add `NEXT_PUBLIC_LIGHTPOLLUTION_TILES`/)).toBeInTheDocument();
  });

  it("renders Bortle map overlay label", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<LocationsMapPanel />);

    expect(screen.getByText("Bortle map overlay")).toBeInTheDocument();
  });

  it("renders darker is better hint", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<LocationsMapPanel />);

    expect(screen.getByText("Darker is better")).toBeInTheDocument();
  });

  it("handles fetch error gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { container } = render(<LocationsMapPanel />);

    // Should still render the component without crashing
    await waitFor(() => {
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  it("handles non-ok response gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const { container } = render(<LocationsMapPanel />);

    // Should still render without crashing
    await waitFor(() => {
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  it("slider has correct min and max values", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<LocationsMapPanel />);

    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("min", "20");
    expect(slider).toHaveAttribute("max", "90");
  });

  it("slider has accessible label", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<LocationsMapPanel />);

    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-label", "Light pollution intensity slider");
  });

  it("has minimum height on container", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    const { container } = render(<LocationsMapPanel />);

    const panel = container.querySelector(".min-h-\\[420px\\]");
    expect(panel).toBeInTheDocument();
  });
});
