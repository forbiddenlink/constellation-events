import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import APODCard from "./APODCard";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, className, ...props }: { src: string; alt: string; className?: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} data-testid="next-image" {...props} />
  )
}));

describe("APODCard", () => {
  const mockAPODData = {
    date: "2026-03-07",
    title: "The Orion Nebula in Dust, Gas, and Stars",
    explanation: "The Orion Nebula is one of the most studied and photographed objects in the night sky. It is a stellar nursery where new stars are being born. The great nebula is the nearest region of massive star formation, lying about 1,350 light-years away. This spectacular image shows intricate details of the cosmic clouds and stellar winds that make this region so captivating to astronomers and stargazers alike.",
    imageUrl: "https://apod.nasa.gov/apod/image/orion.jpg",
    hdImageUrl: "https://apod.nasa.gov/apod/image/orion_hd.jpg",
    mediaType: "image" as const,
    copyright: "NASA/ESA",
    source: "nasa" as const
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders loading state initially", () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<APODCard />);

    // Check for loading skeleton elements
    const loadingContainer = document.querySelector(".animate-pulse");
    expect(loadingContainer).toBeInTheDocument();
  });

  it("fetches and displays APOD data", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAPODData
    });

    render(<APODCard />);

    await waitFor(() => {
      expect(screen.getByText("The Orion Nebula in Dust, Gas, and Stars")).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/apod");
  });

  it("displays NASA APOD badge", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAPODData
    });

    render(<APODCard />);

    await waitFor(() => {
      expect(screen.getByText("NASA APOD")).toBeInTheDocument();
    });
  });

  it("displays date", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAPODData
    });

    render(<APODCard />);

    await waitFor(() => {
      expect(screen.getByText("2026-03-07")).toBeInTheDocument();
    });
  });

  it("displays copyright when available", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAPODData
    });

    render(<APODCard />);

    await waitFor(() => {
      expect(screen.getByText("Credit: NASA/ESA")).toBeInTheDocument();
    });
  });

  it("truncates long explanation and shows Read more button", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAPODData
    });

    render(<APODCard />);

    await waitFor(() => {
      expect(screen.getByText("Read more")).toBeInTheDocument();
    });

    // Explanation should be truncated (ends with ...)
    const explanationText = screen.getByText(/The Orion Nebula is one of/);
    expect(explanationText.textContent).toContain("...");
  });

  it("expands explanation when Read more is clicked", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAPODData
    });

    render(<APODCard />);

    await waitFor(() => {
      expect(screen.getByText("Read more")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Read more"));

    expect(screen.getByText("Show less")).toBeInTheDocument();
    // Full explanation should be visible
    expect(screen.getByText(/astronomers and stargazers alike/)).toBeInTheDocument();
  });

  it("collapses explanation when Show less is clicked", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAPODData
    });

    render(<APODCard />);

    await waitFor(() => {
      expect(screen.getByText("Read more")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Read more"));
    fireEvent.click(screen.getByText("Show less"));

    expect(screen.getByText("Read more")).toBeInTheDocument();
  });

  it("does not show Read more button for short explanations", async () => {
    const shortExplanation = { ...mockAPODData, explanation: "A short explanation." };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => shortExplanation
    });

    render(<APODCard />);

    await waitFor(() => {
      expect(screen.getByText("A short explanation.")).toBeInTheDocument();
    });

    expect(screen.queryByText("Read more")).not.toBeInTheDocument();
  });

  it("displays HD image link when available", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAPODData
    });

    render(<APODCard />);

    await waitFor(() => {
      const hdLink = screen.getByText("View HD Image");
      expect(hdLink).toBeInTheDocument();
      expect(hdLink.closest("a")).toHaveAttribute("href", mockAPODData.hdImageUrl);
      expect(hdLink.closest("a")).toHaveAttribute("target", "_blank");
    });
  });

  it("does not display HD link when not available", async () => {
    const noHdData = { ...mockAPODData, hdImageUrl: undefined };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => noHdData
    });

    render(<APODCard />);

    await waitFor(() => {
      expect(screen.getByText(mockAPODData.title)).toBeInTheDocument();
    });

    expect(screen.queryByText("View HD Image")).not.toBeInTheDocument();
  });

  it("renders video iframe for video media type", async () => {
    const videoData = {
      ...mockAPODData,
      mediaType: "video" as const,
      imageUrl: "https://www.youtube.com/embed/xyz123"
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => videoData
    });

    render(<APODCard />);

    await waitFor(() => {
      const iframe = document.querySelector("iframe");
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute("src", "https://www.youtube.com/embed/xyz123");
      expect(iframe).toHaveAttribute("title", mockAPODData.title);
    });
  });

  it("renders image for image media type", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAPODData
    });

    render(<APODCard />);

    await waitFor(() => {
      const image = screen.getByTestId("next-image");
      expect(image).toHaveAttribute("src", mockAPODData.imageUrl);
      expect(image).toHaveAttribute("alt", mockAPODData.title);
    });
  });

  it("shows fallback card when fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    render(<APODCard />);

    await waitFor(() => {
      expect(screen.getByText(/temporarily unavailable/)).toBeInTheDocument();
    });
  });

  it("shows fallback card when fetch throws error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<APODCard />);

    await waitFor(() => {
      expect(screen.getByText(/temporarily unavailable/)).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch APOD:", expect.any(Error));
    consoleSpy.mockRestore();
  });

  it("does not display copyright when not available", async () => {
    const noCopyrightData = { ...mockAPODData, copyright: undefined };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => noCopyrightData
    });

    render(<APODCard />);

    await waitFor(() => {
      expect(screen.getByText(mockAPODData.title)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Credit:/)).not.toBeInTheDocument();
  });

  it("applies glass styling to container", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAPODData
    });

    const { container } = render(<APODCard />);

    await waitFor(() => {
      expect(screen.getByText(mockAPODData.title)).toBeInTheDocument();
    });

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("glass", "rounded-3xl", "overflow-hidden");
  });
});
