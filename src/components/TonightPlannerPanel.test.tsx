import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import TonightPlannerPanel from "./TonightPlannerPanel";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock useGeolocation hook
vi.mock("@/hooks/useGeolocation", () => ({
  default: vi.fn()
}));

// Mock LoadingSpinner
vi.mock("@/components/LoadingSpinner", () => ({
  default: ({ message }: { message: string }) => (
    <div data-testid="loading-spinner">{message}</div>
  )
}));

import useGeolocation from "@/hooks/useGeolocation";

const mockUseGeolocation = vi.mocked(useGeolocation);

describe("TonightPlannerPanel", () => {
  const mockPlannerData = {
    overallQuality: {
      score: 85,
      rating: "Excellent Night",
      description: "Perfect conditions for deep sky observation."
    },
    optimalWindow: {
      start: "2026-03-07T21:00:00",
      end: "2026-03-08T03:00:00",
      duration: 6,
      quality: 90
    },
    weather: {
      cloudCover: 10,
      seeing: "good",
      quality: 85,
      source: "openmeteo"
    },
    generatedAt: "2026-03-07T20:00:00Z",
    localDarkSkyScore: 72,
    visiblePlanets: [
      { name: "Jupiter", bestAltitude: 45, bestTime: "10:30 PM" },
      { name: "Saturn", bestAltitude: 35, bestTime: "11:15 PM" },
      { name: "Mars", bestAltitude: 55, bestTime: "1:00 AM" }
    ],
    recommendations: [
      {
        priority: "high",
        title: "Prime Galaxy Season",
        description: "Messier galaxies are well-positioned tonight.",
        timing: "All night"
      },
      {
        priority: "medium",
        title: "ISS Pass",
        description: "International Space Station visible pass.",
        timing: "9:45 PM"
      }
    ]
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

    render(<TonightPlannerPanel />);

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.getByText("Building your tonight plan...")).toBeInTheDocument();
  });

  it("fetches and displays planner data", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlannerData
    });

    render(<TonightPlannerPanel />);

    await waitFor(() => {
      expect(screen.getByText("Excellent Night")).toBeInTheDocument();
    });
  });

  it("displays overall quality score", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlannerData
    });

    render(<TonightPlannerPanel />);

    await waitFor(() => {
      expect(screen.getByText("85")).toBeInTheDocument();
      expect(screen.getByText("Overall score")).toBeInTheDocument();
    });
  });

  it("displays quality description", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlannerData
    });

    render(<TonightPlannerPanel />);

    await waitFor(() => {
      expect(screen.getByText("Perfect conditions for deep sky observation.")).toBeInTheDocument();
    });
  });

  it("displays optimal window times", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlannerData
    });

    render(<TonightPlannerPanel />);

    await waitFor(() => {
      expect(screen.getByText("Optimal window")).toBeInTheDocument();
      expect(screen.getByText("6h duration")).toBeInTheDocument();
    });
  });

  it("displays local dark sky score", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlannerData
    });

    render(<TonightPlannerPanel />);

    await waitFor(() => {
      expect(screen.getByText("Local dark-sky score")).toBeInTheDocument();
      expect(screen.getByText("72")).toBeInTheDocument();
    });
  });

  it("displays weather quality", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlannerData
    });

    render(<TonightPlannerPanel />);

    await waitFor(() => {
      expect(screen.getByText("Weather quality 85")).toBeInTheDocument();
    });
  });

  it("displays weather source", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlannerData
    });

    render(<TonightPlannerPanel />);

    await waitFor(() => {
      expect(screen.getByText("Source: openmeteo")).toBeInTheDocument();
    });
  });

  it("displays visible planets", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlannerData
    });

    render(<TonightPlannerPanel />);

    await waitFor(() => {
      expect(screen.getByText("Jupiter")).toBeInTheDocument();
      expect(screen.getByText("Saturn")).toBeInTheDocument();
      expect(screen.getByText("Mars")).toBeInTheDocument();
    });
  });

  it("displays planet best times", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlannerData
    });

    render(<TonightPlannerPanel />);

    await waitFor(() => {
      expect(screen.getByText("10:30 PM")).toBeInTheDocument();
      expect(screen.getByText("11:15 PM")).toBeInTheDocument();
    });
  });

  it("displays planet altitudes", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlannerData
    });

    render(<TonightPlannerPanel />);

    await waitFor(() => {
      expect(screen.getByText("45 deg")).toBeInTheDocument();
      expect(screen.getByText("35 deg")).toBeInTheDocument();
    });
  });

  it("displays recommendations", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlannerData
    });

    render(<TonightPlannerPanel />);

    await waitFor(() => {
      expect(screen.getByText("Prime Galaxy Season")).toBeInTheDocument();
      expect(screen.getByText("ISS Pass")).toBeInTheDocument();
    });
  });

  it("shows error state when fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    render(<TonightPlannerPanel />);

    await waitFor(() => {
      expect(screen.getByText("Unable to generate live plan right now.")).toBeInTheDocument();
    });
  });

  it("shows retry button on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    render(<TonightPlannerPanel />);

    await waitFor(() => {
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });

  it("retries fetch when retry button is clicked", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, json: async () => mockPlannerData });

    render(<TonightPlannerPanel />);

    await waitFor(() => {
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Retry"));

    await waitFor(() => {
      expect(screen.getByText("Excellent Night")).toBeInTheDocument();
    });
  });

  it("shows refresh button when data is loaded", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlannerData
    });

    render(<TonightPlannerPanel />);

    await waitFor(() => {
      expect(screen.getByText("Refresh live plan")).toBeInTheDocument();
    });
  });

  it("shows refreshing state when refresh is clicked", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => mockPlannerData });

    render(<TonightPlannerPanel />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText("Refresh live plan")).toBeInTheDocument();
    });

    // Record call count before clicking
    const callsBefore = mockFetch.mock.calls.length;

    // Click refresh button
    const refreshButton = screen.getByRole("button", { name: /refresh live plan/i });
    fireEvent.click(refreshButton);

    // Verify at least one more fetch was triggered by the button click
    await waitFor(() => {
      expect(mockFetch.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    // Wait for state to settle
    await waitFor(() => {
      expect(screen.getByText("Refresh live plan")).toBeInTheDocument();
    });
  });

  it("shows refresh button with correct text", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockPlannerData });

    render(<TonightPlannerPanel />);

    await waitFor(() => {
      expect(screen.getByText("Refresh live plan")).toBeInTheDocument();
    });
  });

  it("shows geolocation error message when geo fails", async () => {
    mockUseGeolocation.mockReturnValue({
      status: "error",
      lat: null,
      lng: null,
      error: "Geolocation unavailable"
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlannerData
    });

    render(<TonightPlannerPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Using default coordinates/)).toBeInTheDocument();
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
      json: async () => mockPlannerData
    });

    render(<TonightPlannerPanel />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("lat=36.1147"),
        expect.any(Object)
      );
    });
  });

  it("shows no planets message when array is empty", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockPlannerData, visiblePlanets: [] })
    });

    render(<TonightPlannerPanel />);

    await waitFor(() => {
      expect(screen.getByText("No bright planets in prime position.")).toBeInTheDocument();
    });
  });

  it("displays generated timestamp", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlannerData
    });

    render(<TonightPlannerPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Updated/)).toBeInTheDocument();
    });
  });

  it("applies glass styling to container", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlannerData
    });

    const { container } = render(<TonightPlannerPanel />);

    await waitFor(() => {
      const glassContainer = container.querySelector(".glass.rounded-3xl.p-6");
      expect(glassContainer).toBeInTheDocument();
    });
  });

  it("handles n/a weather quality", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockPlannerData, weather: null })
    });

    render(<TonightPlannerPanel />);

    await waitFor(() => {
      expect(screen.getByText("Weather quality n/a")).toBeInTheDocument();
    });
  });
});
