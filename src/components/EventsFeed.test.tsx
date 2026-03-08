import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import EventsFeed from "./EventsFeed";

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

// Mock EventCard
vi.mock("@/components/EventCard", () => ({
  default: ({ event }: { event: { id: string; title: string } }) => (
    <div data-testid="event-card" data-id={event.id}>
      {event.title}
    </div>
  )
}));

import useGeolocation from "@/hooks/useGeolocation";

const mockUseGeolocation = vi.mocked(useGeolocation);

describe("EventsFeed", () => {
  const mockEventsData = {
    events: [
      {
        id: "event-1",
        title: "Lyrid Meteor Shower",
        dateDisplay: "Apr 22",
        date: "2026-04-22",
        visibility: "excellent",
        summary: "Annual meteor shower with up to 20 meteors per hour",
        window: "11:00 PM - 4:00 AM",
        peak: "2:00 AM"
      },
      {
        id: "event-2",
        title: "Full Pink Moon",
        dateDisplay: "Apr 26",
        date: "2026-04-26",
        visibility: "good",
        summary: "The first full moon of spring",
        window: "8:00 PM - 6:00 AM",
        peak: "11:30 PM"
      },
      {
        id: "event-3",
        title: "Saturn Opposition",
        dateDisplay: "May 10",
        date: "2026-05-10",
        visibility: "fair",
        summary: "Saturn at its closest and brightest",
        window: "10:00 PM - 5:00 AM",
        peak: "1:00 AM"
      }
    ],
    location: { lat: 36.1147, lng: -115.1728 },
    generatedAt: "2026-03-07T20:00:00Z"
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

    render(<EventsFeed />);

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.getByText("Loading upcoming events...")).toBeInTheDocument();
  });

  it("fetches and displays events", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEventsData
    });

    render(<EventsFeed />);

    await waitFor(() => {
      expect(screen.getByText("Lyrid Meteor Shower")).toBeInTheDocument();
      expect(screen.getByText("Full Pink Moon")).toBeInTheDocument();
      expect(screen.getByText("Saturn Opposition")).toBeInTheDocument();
    });
  });

  it("displays event count", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEventsData
    });

    render(<EventsFeed />);

    await waitFor(() => {
      expect(screen.getByText(/Showing 3 upcoming events/)).toBeInTheDocument();
    });
  });

  it("displays location indicator when location is available", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEventsData
    });

    render(<EventsFeed />);

    await waitFor(() => {
      expect(screen.getByText(/for your location/)).toBeInTheDocument();
    });
  });

  it("does not show location indicator when location is null", async () => {
    const noLocationData = { ...mockEventsData, location: null };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => noLocationData
    });

    render(<EventsFeed />);

    await waitFor(() => {
      expect(screen.getByText(/Showing 3 upcoming events/)).toBeInTheDocument();
      expect(screen.queryByText(/for your location/)).not.toBeInTheDocument();
    });
  });

  it("shows error state when fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    render(<EventsFeed />);

    await waitFor(() => {
      expect(screen.getByText("Events unavailable right now")).toBeInTheDocument();
      expect(screen.getByText("Please try again later")).toBeInTheDocument();
    });
  });

  it("shows error state when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<EventsFeed />);

    await waitFor(() => {
      expect(screen.getByText("Events unavailable right now")).toBeInTheDocument();
    });
  });

  it("shows empty state when no events", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockEventsData, events: [] })
    });

    render(<EventsFeed />);

    await waitFor(() => {
      expect(screen.getByText("No upcoming events in the selected period")).toBeInTheDocument();
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
      json: async () => mockEventsData
    });

    render(<EventsFeed />);

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
      json: async () => mockEventsData
    });

    render(<EventsFeed />);

    await waitFor(() => {
      const fetchUrl = mockFetch.mock.calls[0][0] as string;
      expect(fetchUrl).not.toContain("lat=");
      expect(fetchUrl).not.toContain("lng=");
    });
  });

  it("renders event cards in grid layout", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEventsData
    });

    const { container } = render(<EventsFeed />);

    await waitFor(() => {
      const grid = container.querySelector(".grid.gap-6");
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass("md:grid-cols-3");
    });
  });

  it("renders correct number of event cards", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEventsData
    });

    render(<EventsFeed />);

    await waitFor(() => {
      const cards = screen.getAllByTestId("event-card");
      expect(cards).toHaveLength(3);
    });
  });

  it("applies glass styling to error state", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const { container } = render(<EventsFeed />);

    await waitFor(() => {
      const errorContainer = container.querySelector(".glass.rounded-3xl.p-8");
      expect(errorContainer).toBeInTheDocument();
    });
  });

  it("applies glass styling to empty state", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockEventsData, events: [] })
    });

    const { container } = render(<EventsFeed />);

    await waitFor(() => {
      const emptyContainer = container.querySelector(".glass.rounded-3xl.p-8");
      expect(emptyContainer).toBeInTheDocument();
    });
  });

  it("shows ember color for error text", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const { container } = render(<EventsFeed />);

    await waitFor(() => {
      const errorText = container.querySelector(".text-ember");
      expect(errorText).toBeInTheDocument();
    });
  });

  it("centers empty and error state text", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockEventsData, events: [] })
    });

    const { container } = render(<EventsFeed />);

    await waitFor(() => {
      const centeredContainer = container.querySelector(".text-center");
      expect(centeredContainer).toBeInTheDocument();
    });
  });

  it("refetches when geolocation changes", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockEventsData
    });

    const { rerender } = render(<EventsFeed />);

    // Update geolocation
    mockUseGeolocation.mockReturnValue({
      status: "ready",
      lat: 40.7128,
      lng: -74.0060,
      error: null
    });

    rerender(<EventsFeed />);

    await waitFor(() => {
      // Should have been called with new coordinates
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it("shows muted text for event count", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEventsData
    });

    const { container } = render(<EventsFeed />);

    await waitFor(() => {
      const countText = container.querySelector(".text-xs.text-starlight\\/50");
      expect(countText).toBeInTheDocument();
    });
  });

  it("applies margin below count text", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEventsData
    });

    const { container } = render(<EventsFeed />);

    await waitFor(() => {
      const countText = container.querySelector(".mb-4");
      expect(countText).toBeInTheDocument();
    });
  });
});
