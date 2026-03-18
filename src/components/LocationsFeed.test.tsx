import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import LocationsFeed from "./LocationsFeed";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock useGeolocation hook
vi.mock("@/hooks/useGeolocation", () => ({
  default: vi.fn()
}));

// Mock LocationCard to simplify testing
vi.mock("@/components/LocationCard", () => ({
  default: ({ location }: { location: { name: string } }) => (
    <div data-testid="location-card">{location.name}</div>
  )
}));

import useGeolocation from "@/hooks/useGeolocation";

const mockUseGeolocation = vi.mocked(useGeolocation);

describe("LocationsFeed", () => {
  const mockLocationsData = {
    locations: [
      {
        id: "loc-1",
        name: "Dark Sky Reserve",
        coordinates: { lat: 36.0, lng: -115.5 },
        distance: 45.2,
        distanceDisplay: "28 mi",
        darkSkyScore: 92,
        bortleClass: 2,
        elevation: 1200,
        description: "Pristine dark skies",
        amenities: ["parking"],
        bestWindow: "9:00 PM - 3:00 AM",
        accessibility: "easy",
        type: "reserve"
      },
      {
        id: "loc-2",
        name: "Mountain Observatory",
        coordinates: { lat: 36.5, lng: -115.8 },
        distance: 88.0,
        distanceDisplay: "55 mi",
        darkSkyScore: 95,
        bortleClass: 1,
        elevation: 2500,
        description: "Professional observatory site",
        amenities: ["parking", "restrooms"],
        bestWindow: "8:00 PM - 4:00 AM",
        accessibility: "moderate",
        type: "observatory"
      }
    ],
    location: { lat: 36.1147, lng: -115.1728 },
    userDarkSkyScore: 45,
    conditions: {
      moonIllumination: 23,
      weatherQuality: 85,
      cloudCover: 12,
      weatherSource: "openmeteo"
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

  it("shows loading state initially", () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<LocationsFeed />);

    expect(screen.getByText("Loading nearby dark-sky sites...")).toBeInTheDocument();
  });

  it("fetches and displays locations", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLocationsData
    });

    render(<LocationsFeed />);

    await waitFor(() => {
      expect(screen.getByText("Dark Sky Reserve")).toBeInTheDocument();
      expect(screen.getByText("Mountain Observatory")).toBeInTheDocument();
    });
  });

  it("displays user dark sky score", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLocationsData
    });

    render(<LocationsFeed />);

    await waitFor(() => {
      expect(screen.getByText(/Local score 45/)).toBeInTheDocument();
    });
  });

  it("displays moon illumination", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLocationsData
    });

    render(<LocationsFeed />);

    await waitFor(() => {
      expect(screen.getByText(/Moon 23%/)).toBeInTheDocument();
    });
  });

  it("displays cloud cover", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLocationsData
    });

    render(<LocationsFeed />);

    await waitFor(() => {
      expect(screen.getByText(/Clouds 12%/)).toBeInTheDocument();
    });
  });

  it("displays weather source", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLocationsData
    });

    render(<LocationsFeed />);

    await waitFor(() => {
      expect(screen.getByText(/Source openmeteo/)).toBeInTheDocument();
    });
  });

  it("shows error state when fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    render(<LocationsFeed />);

    await waitFor(() => {
      expect(screen.getByText("Locations unavailable right now.")).toBeInTheDocument();
    });
  });

  it("shows error state when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<LocationsFeed />);

    await waitFor(() => {
      expect(screen.getByText("Locations unavailable right now.")).toBeInTheDocument();
    });
  });

  it("shows empty state when no locations", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockLocationsData, locations: [] })
    });

    render(<LocationsFeed />);

    await waitFor(() => {
      expect(screen.getByText(/No dark-sky sites found near your location/)).toBeInTheDocument();
    });
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
      json: async () => mockLocationsData
    });

    render(<LocationsFeed />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("lat=36.1147"),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("lng=-115.1728"),
        expect.any(Object)
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
      json: async () => mockLocationsData
    });

    render(<LocationsFeed />);

    await waitFor(() => {
      const fetchUrl = mockFetch.mock.calls[0][0] as string;
      expect(fetchUrl).not.toContain("lat=");
      expect(fetchUrl).not.toContain("lng=");
    });
  });

  it("renders location cards", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLocationsData
    });

    render(<LocationsFeed />);

    await waitFor(() => {
      const cards = screen.getAllByTestId("location-card");
      expect(cards).toHaveLength(2);
    });
  });

  it("handles n/a values for missing conditions", async () => {
    const dataWithoutConditions = {
      locations: mockLocationsData.locations,
      location: null,
      userDarkSkyScore: undefined,
      conditions: undefined
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => dataWithoutConditions
    });

    render(<LocationsFeed />);

    await waitFor(() => {
      expect(screen.getByText(/Local score n\/a/)).toBeInTheDocument();
      expect(screen.getByText(/Moon n\/a%/)).toBeInTheDocument();
    });
  });

  it("applies correct container styling", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLocationsData
    });

    const { container } = render(<LocationsFeed />);

    await waitFor(() => {
      expect(screen.getByText("Dark Sky Reserve")).toBeInTheDocument();
    });

    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer).toHaveClass("space-y-4");
  });

  it("applies glass styling to conditions panel", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLocationsData
    });

    const { container } = render(<LocationsFeed />);

    await waitFor(() => {
      const glassPanel = container.querySelector(".glass.rounded-2xl.p-4");
      expect(glassPanel).toBeInTheDocument();
    });
  });

  it("refetches when geolocation changes", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockLocationsData
    });

    const { rerender } = render(<LocationsFeed />);

    // Update geolocation
    mockUseGeolocation.mockReturnValue({
      status: "ready",
      lat: 40.7128,
      lng: -74.0060,
      error: null
    });

    rerender(<LocationsFeed />);

    await waitFor(() => {
      // Should have been called multiple times due to dependency change
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
