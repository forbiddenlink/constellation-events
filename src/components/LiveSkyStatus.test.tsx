import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import LiveSkyStatus from "./LiveSkyStatus";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock useGeolocation hook
vi.mock("@/hooks/useGeolocation", () => ({
  default: vi.fn()
}));

import useGeolocation from "@/hooks/useGeolocation";

const mockUseGeolocation = vi.mocked(useGeolocation);

function mockJsonResponse(data: unknown, ok = true) {
  return Promise.resolve(new Response(JSON.stringify(data), {
    status: ok ? 200 : 500,
    headers: { "Content-Type": "application/json" }
  }));
}

function mockErrorResponse() {
  return Promise.resolve(new Response(null, { status: 500 }));
}

describe("LiveSkyStatus", () => {
  const mockSkyQualityData = {
    cloudCover: 15,
    seeing: "good" as const,
    transparency: 80,
    humidity: 35,
    temperature: 18,
    windSpeed: 5,
    quality: 75,
    source: "openweather" as const
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

  it("shows checking state initially", () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<LiveSkyStatus />);

    expect(screen.getByText("Checking sky quality...")).toBeInTheDocument();
  });

  it("renders with pulse animation during checking", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    const { container } = render(<LiveSkyStatus />);

    const indicator = container.querySelector(".animate-pulse");
    expect(indicator).toBeInTheDocument();
  });

  it("applies correct container styling", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    const { container } = render(<LiveSkyStatus />);

    const statusContainer = container.firstChild as HTMLElement;
    expect(statusContainer).toHaveClass(
      "inline-flex",
      "items-center",
      "gap-3",
      "rounded-full"
    );
  });

  it("waits for geolocation before fetching", () => {
    mockUseGeolocation.mockReturnValue({
      status: "loading",
      lat: null,
      lng: null,
      error: null
    });

    render(<LiveSkyStatus />);

    // Should show checking state while waiting for geolocation
    expect(screen.getByText("Checking sky quality...")).toBeInTheDocument();
  });

  it("fetches sky quality when geolocation is ready", async () => {
    mockUseGeolocation.mockReturnValue({
      status: "ready",
      lat: 36.1147,
      lng: -115.1728,
      error: null
    });

    mockFetch.mockImplementation(() => mockJsonResponse(mockSkyQualityData));

    render(<LiveSkyStatus />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it("uses default location when geolocation has error", async () => {
    mockUseGeolocation.mockReturnValue({
      status: "error",
      lat: null,
      lng: null,
      error: "Geolocation unavailable"
    });

    mockFetch.mockImplementation(() => mockJsonResponse(mockSkyQualityData));

    render(<LiveSkyStatus />);

    await waitFor(() => {
      // Should have called fetch — verify via Request.url or call count
      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0][0];
      const url = typeof call === "string" ? call : (call as Request).url;
      expect(url).toContain("lat=36.1147");
    }, { timeout: 2000 });
  });

  it("shows estimated quality on fetch error", async () => {
    mockUseGeolocation.mockReturnValue({
      status: "ready",
      lat: 36.1147,
      lng: -115.1728,
      error: null
    });

    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<LiveSkyStatus />);

    await waitFor(() => {
      expect(screen.getByText("Sky quality: Good (estimated)")).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it("shows estimated quality on non-ok response", async () => {
    mockUseGeolocation.mockReturnValue({
      status: "ready",
      lat: 36.1147,
      lng: -115.1728,
      error: null
    });

    mockFetch.mockImplementation(() => mockErrorResponse());

    render(<LiveSkyStatus />);

    await waitFor(() => {
      expect(screen.getByText("Sky quality: Good (estimated)")).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it("applies border styling", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    const { container } = render(<LiveSkyStatus />);

    const statusContainer = container.firstChild as HTMLElement;
    expect(statusContainer.className).toContain("border");
    expect(statusContainer.className).toContain("border-white/15");
  });

  it("applies background styling", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    const { container } = render(<LiveSkyStatus />);

    const statusContainer = container.firstChild as HTMLElement;
    expect(statusContainer.className).toContain("bg-white/5");
  });

  it("renders status indicator dot", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    const { container } = render(<LiveSkyStatus />);

    const indicator = container.querySelector(".h-2.w-2.rounded-full");
    expect(indicator).toBeInTheDocument();
  });

  it("applies text styling", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    const { container } = render(<LiveSkyStatus />);

    const statusContainer = container.firstChild as HTMLElement;
    expect(statusContainer.className).toContain("text-xs");
    expect(statusContainer.className).toContain("text-starlight/70");
  });

  it("applies padding styling", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    const { container } = render(<LiveSkyStatus />);

    const statusContainer = container.firstChild as HTMLElement;
    expect(statusContainer.className).toContain("px-4");
    expect(statusContainer.className).toContain("py-2");
  });
});
