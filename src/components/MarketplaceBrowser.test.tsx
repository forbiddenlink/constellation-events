import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import MarketplaceBrowser from "./MarketplaceBrowser";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageData: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => localStorageData[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { localStorageData[key] = value; }),
  removeItem: vi.fn((key: string) => { delete localStorageData[key]; })
};
Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

// Mock LoadingSpinner
vi.mock("@/components/LoadingSpinner", () => ({
  default: ({ message }: { message: string }) => (
    <div data-testid="loading-spinner">{message}</div>
  )
}));

// Mock ListingCard
vi.mock("@/components/ListingCard", () => ({
  default: ({ listing }: { listing: { id: string; title: string } }) => (
    <div data-testid="listing-card" data-id={listing.id}>
      {listing.title}
    </div>
  )
}));

describe("MarketplaceBrowser", () => {
  const mockMarketplaceData = {
    listings: [
      {
        id: "1",
        title: "Celestron 8SE",
        tag: "Schmidt-Cassegrain",
        category: "telescope",
        condition: "good",
        priceUsd: 850,
        city: "Tucson, AZ",
        shipping: true,
        description: "Excellent computerized telescope",
        imageUrl: "https://example.com/telescope.jpg",
        status: "approved",
        createdAt: "2026-03-01T10:00:00Z"
      },
      {
        id: "2",
        title: "ZWO ASI294MC Pro",
        tag: "Cooled CMOS",
        category: "camera",
        condition: "like-new",
        priceUsd: 1200,
        city: "Denver, CO",
        shipping: true,
        description: "Professional astrophotography camera",
        imageUrl: "https://example.com/camera.jpg",
        status: "approved",
        createdAt: "2026-03-02T12:00:00Z"
      }
    ],
    count: 2,
    generatedAt: "2026-03-07T20:00:00Z"
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage data
    Object.keys(localStorageData).forEach(key => delete localStorageData[key]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading state initially", () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<MarketplaceBrowser />);

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.getByText("Loading listings...")).toBeInTheDocument();
  });

  it("fetches and displays listings", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMarketplaceData
    });

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      expect(screen.getByText("Celestron 8SE")).toBeInTheDocument();
      expect(screen.getByText("ZWO ASI294MC Pro")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("displays search input", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMarketplaceData
    });

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText("Search listings...");
      expect(searchInput).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("displays category filter", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMarketplaceData
    });

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      expect(screen.getByText("All categories")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("shows empty state when no results", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockMarketplaceData, listings: [] })
    });

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      expect(screen.getByText(/No results found/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("shows seller form toggle button after entering token", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMarketplaceData
    });

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter seller token...")).toBeInTheDocument();
    }, { timeout: 3000 });

    fireEvent.change(screen.getByPlaceholderText("Enter seller token..."), { target: { value: "test-token" } });

    await waitFor(() => {
      expect(screen.getByText(/Create a new listing/)).toBeInTheDocument();
    });
  });

  it("toggles seller form visibility", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMarketplaceData
    });

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter seller token...")).toBeInTheDocument();
    }, { timeout: 3000 });

    fireEvent.change(screen.getByPlaceholderText("Enter seller token..."), { target: { value: "test-token" } });

    await waitFor(() => {
      expect(screen.getByText(/Create a new listing/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Create a new listing/));

    await waitFor(() => {
      expect(screen.getByText("New listing")).toBeInTheDocument();
    });
  });

  it("displays seller form fields when expanded", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMarketplaceData
    });

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter seller token...")).toBeInTheDocument();
    }, { timeout: 3000 });

    fireEvent.change(screen.getByPlaceholderText("Enter seller token..."), { target: { value: "test-token" } });

    await waitFor(() => {
      expect(screen.getByText(/Create a new listing/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Create a new listing/));

    await waitFor(() => {
      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText(/Price \(USD\)/)).toBeInTheDocument();
    });
  });

  it("selects first listing by default", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMarketplaceData
    });

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      // The detail panel renders in both mobile and desktop containers
      const headings = screen.getAllByRole("heading", { name: "Celestron 8SE" });
      expect(headings.length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });
  });

  it("displays selected listing details", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMarketplaceData
    });

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      const descriptions = screen.getAllByText("Excellent computerized telescope");
      expect(descriptions.length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });
  });

  it("shows contact seller button for selected listing", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMarketplaceData
    });

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      const buttons = screen.getAllByText("Inquire about listing");
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });
  });

  it("handles fetch error gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<MarketplaceBrowser />);

    // Wait for error state to fully render
    await waitFor(() => {
      expect(screen.getByText(/Unable to load marketplace listings/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("handles non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    render(<MarketplaceBrowser />);

    // Wait for error state to fully render
    await waitFor(() => {
      expect(screen.getByText(/Unable to load marketplace listings/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("displays search & filter heading", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockMarketplaceData
    });

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      expect(screen.getByText(/Search/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("renders listing header row", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockMarketplaceData
    });

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      expect(screen.getByText("Item")).toBeInTheDocument();
      expect(screen.getByText("Price")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("renders listing cards", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMarketplaceData
    });

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      const cards = screen.getAllByTestId("listing-card");
      expect(cards.length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });
  });

  it("has search input with correct placeholder", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockMarketplaceData
    });

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search listings...")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("has category select dropdown", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockMarketplaceData
    });

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      const comboboxes = screen.getAllByRole("combobox");
      expect(comboboxes.length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });
  });
});
