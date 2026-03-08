import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Store the original env
const originalEnv = { ...process.env };

// Mock mapbox-gl with vi.hoisted to properly initialize the mock
const { mockMap, MockMapClass, setAccessToken, getAccessToken } = vi.hoisted(() => {
  const mockMap = {
    on: vi.fn(),
    remove: vi.fn(),
    flyTo: vi.fn(),
    isStyleLoaded: vi.fn(() => true),
    getSource: vi.fn(),
    addSource: vi.fn(),
    getLayer: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    removeSource: vi.fn(),
    setPaintProperty: vi.fn()
  };

  // Create a proper mock constructor class
  class MockMapClass {
    on = mockMap.on;
    remove = mockMap.remove;
    flyTo = mockMap.flyTo;
    isStyleLoaded = mockMap.isStyleLoaded;
    getSource = mockMap.getSource;
    addSource = mockMap.addSource;
    getLayer = mockMap.getLayer;
    addLayer = mockMap.addLayer;
    removeLayer = mockMap.removeLayer;
    removeSource = mockMap.removeSource;
    setPaintProperty = mockMap.setPaintProperty;
  }

  let accessToken = "";
  const setAccessToken = (token: string) => {
    accessToken = token;
  };
  const getAccessToken = () => accessToken;

  return { mockMap, MockMapClass, setAccessToken, getAccessToken };
});

vi.mock("mapbox-gl", () => ({
  default: {
    get accessToken() {
      return getAccessToken();
    },
    set accessToken(value: string) {
      setAccessToken(value);
    },
    Map: MockMapClass
  }
}));

// Mock useGeolocation hook
vi.mock("@/hooks/useGeolocation", () => ({
  default: vi.fn()
}));

import useGeolocation from "@/hooks/useGeolocation";
import StarMap from "./StarMap";

const mockUseGeolocation = vi.mocked(useGeolocation);

describe("StarMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mapbox token
    setAccessToken("test-token");
    // Default geolocation state
    mockUseGeolocation.mockReturnValue({
      status: "idle",
      lat: null,
      lng: null,
      error: null
    });
    // Reset map mock
    mockMap.on.mockImplementation((event: string, callback: () => void) => {
      if (event === "load") {
        // Simulate map load
        setTimeout(callback, 0);
      }
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("renders the map container", () => {
    const { container } = render(
      <StarMap showLightPollution={false} overlayOpacity={0.5} />
    );

    const mapContainer = container.querySelector(".h-64");
    expect(mapContainer).toBeInTheDocument();
    expect(mapContainer).toHaveClass("rounded-2xl", "border", "border-white/10", "bg-white/5");
  });

  it("shows fallback message when no Mapbox token", () => {
    setAccessToken("");

    render(<StarMap showLightPollution={false} overlayOpacity={0.5} />);

    expect(screen.getByText(/Add `NEXT_PUBLIC_MAPBOX_TOKEN` to enable the live sky map/)).toBeInTheDocument();
  });

  it("does not show fallback message when token is present", () => {
    render(<StarMap showLightPollution={false} overlayOpacity={0.5} />);

    expect(screen.queryByText(/Add `NEXT_PUBLIC_MAPBOX_TOKEN`/)).not.toBeInTheDocument();
  });

  it("renders inner container for map", () => {
    const { container } = render(
      <StarMap showLightPollution={false} overlayOpacity={0.5} />
    );

    const innerContainer = container.querySelector(".h-full.w-full");
    expect(innerContainer).toBeInTheDocument();
  });

  it("applies overflow hidden to container", () => {
    const { container } = render(
      <StarMap showLightPollution={false} overlayOpacity={0.5} />
    );

    const mapContainer = container.firstChild as HTMLElement;
    expect(mapContainer).toHaveClass("overflow-hidden");
  });

  it("uses geolocation when available", () => {
    mockUseGeolocation.mockReturnValue({
      status: "ready",
      lat: 36.1147,
      lng: -115.1728,
      error: null
    });

    render(<StarMap showLightPollution={false} overlayOpacity={0.5} />);

    // Component should use geolocation coordinates
    expect(mockUseGeolocation).toHaveBeenCalled();
  });

  it("handles geolocation error state", () => {
    mockUseGeolocation.mockReturnValue({
      status: "error",
      lat: null,
      lng: null,
      error: "Geolocation unavailable"
    });

    // Should not throw
    const { container } = render(
      <StarMap showLightPollution={false} overlayOpacity={0.5} />
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  it("handles loading geolocation state", () => {
    mockUseGeolocation.mockReturnValue({
      status: "loading",
      lat: null,
      lng: null,
      error: null
    });

    const { container } = render(
      <StarMap showLightPollution={false} overlayOpacity={0.5} />
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  it("accepts showLightPollution prop", () => {
    const { rerender } = render(
      <StarMap showLightPollution={false} overlayOpacity={0.5} />
    );

    // Should not throw when toggling
    rerender(<StarMap showLightPollution={true} overlayOpacity={0.5} />);
  });

  it("accepts overlayOpacity prop", () => {
    const { rerender } = render(
      <StarMap showLightPollution={true} overlayOpacity={0.3} />
    );

    // Should not throw when changing opacity
    rerender(<StarMap showLightPollution={true} overlayOpacity={0.8} />);
  });

  it("renders with relative positioning", () => {
    const { container } = render(
      <StarMap showLightPollution={false} overlayOpacity={0.5} />
    );

    const mapContainer = container.firstChild as HTMLElement;
    expect(mapContainer).toHaveClass("relative");
  });

  it("handles missing light pollution tiles env var", () => {
    // Component should handle missing env var gracefully
    const { container } = render(
      <StarMap showLightPollution={true} overlayOpacity={0.5} />
    );

    expect(container.firstChild).toBeInTheDocument();
  });
});
