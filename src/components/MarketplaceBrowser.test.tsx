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

// Mock the better-auth client. Defaults to signed-out; tests that need the
// seller form opt in with mockUseSession.mockReturnValue(...).
type MockSessionData = { user: { id: string; email: string } } | null;
const mockUseSession = vi.fn<() => { data: MockSessionData }>(() => ({ data: null }));
vi.mock("@/lib/auth-client", () => ({
  useSession: () => mockUseSession(),
  signIn: { email: vi.fn().mockResolvedValue({ error: null }) },
  signUp: { email: vi.fn().mockResolvedValue({ error: null }) },
  signOut: vi.fn()
}));

function mockJsonResponse(data: unknown) {
  return Promise.resolve(new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  }));
}

function mockErrorResponse(status = 500) {
  return Promise.resolve(new Response(JSON.stringify({ error: "Error" }), {
    status,
    headers: { "Content-Type": "application/json" }
  }));
}

// Timeout for all async tests — component has 150ms debounce
const TIMEOUT = 3000;

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
    mockUseSession.mockReturnValue({ data: null });
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
    mockFetch.mockImplementation(() => mockJsonResponse(mockMarketplaceData));

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      expect(screen.getByText("Celestron 8SE")).toBeInTheDocument();
      expect(screen.getByText("ZWO ASI294MC Pro")).toBeInTheDocument();
    }, { timeout: TIMEOUT });
  });

  it("displays search input", async () => {
    mockFetch.mockImplementation(() => mockJsonResponse(mockMarketplaceData));

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText("Search listings...");
      expect(searchInput).toBeInTheDocument();
    }, { timeout: TIMEOUT });
  });

  it("displays category filter", async () => {
    mockFetch.mockImplementation(() => mockJsonResponse(mockMarketplaceData));

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      expect(screen.getByText("All categories")).toBeInTheDocument();
    }, { timeout: TIMEOUT });
  });

  it("shows empty state when no results", async () => {
    mockFetch.mockImplementation(() => mockJsonResponse({ ...mockMarketplaceData, listings: [] }));

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      expect(screen.getByText(/No results found/)).toBeInTheDocument();
    }, { timeout: TIMEOUT });
  });

  it("shows a sign-in form when signed out, not a token input", async () => {
    mockFetch.mockImplementation(() => mockJsonResponse(mockMarketplaceData));

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    }, { timeout: TIMEOUT });

    expect(screen.queryByPlaceholderText("Enter seller token...")).not.toBeInTheDocument();
    expect(screen.queryByText(/Create a new listing/)).not.toBeInTheDocument();
  });

  it("toggles seller form visibility once signed in", async () => {
    mockUseSession.mockReturnValue({ data: { user: { id: "user-1", email: "seller@example.com" } } });
    mockFetch.mockImplementation(() => mockJsonResponse(mockMarketplaceData));

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      expect(screen.getByText(/Create a new listing/)).toBeInTheDocument();
    }, { timeout: TIMEOUT });

    fireEvent.click(screen.getByText(/Create a new listing/));

    await waitFor(() => {
      expect(screen.getByText("New listing")).toBeInTheDocument();
    }, { timeout: TIMEOUT });
  });

  it("displays seller form fields when expanded and signed in", async () => {
    mockUseSession.mockReturnValue({ data: { user: { id: "user-1", email: "seller@example.com" } } });
    mockFetch.mockImplementation(() => mockJsonResponse(mockMarketplaceData));

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      expect(screen.getByText(/Create a new listing/)).toBeInTheDocument();
    }, { timeout: TIMEOUT });

    fireEvent.click(screen.getByText(/Create a new listing/));

    await waitFor(() => {
      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText(/Price \(USD\)/)).toBeInTheDocument();
    }, { timeout: TIMEOUT });
  });

  it("selects first listing by default", async () => {
    mockFetch.mockImplementation(() => mockJsonResponse(mockMarketplaceData));

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      // The detail panel renders in both mobile and desktop containers
      const headings = screen.getAllByRole("heading", { name: "Celestron 8SE" });
      expect(headings.length).toBeGreaterThanOrEqual(1);
    }, { timeout: TIMEOUT });
  });

  it("displays selected listing details", async () => {
    mockFetch.mockImplementation(() => mockJsonResponse(mockMarketplaceData));

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      const descriptions = screen.getAllByText("Excellent computerized telescope");
      expect(descriptions.length).toBeGreaterThanOrEqual(1);
    }, { timeout: TIMEOUT });
  });

  it("shows contact seller button for selected listing", async () => {
    mockFetch.mockImplementation(() => mockJsonResponse(mockMarketplaceData));

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      const buttons = screen.getAllByText("Inquire about listing");
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    }, { timeout: TIMEOUT });
  });

  it("handles fetch error gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<MarketplaceBrowser />);

    // Wait for error state to fully render
    await waitFor(() => {
      expect(screen.getByText(/Unable to load marketplace listings/)).toBeInTheDocument();
    }, { timeout: TIMEOUT });
  });

  it("handles non-ok response", async () => {
    mockFetch.mockImplementation(() => mockErrorResponse(500));

    render(<MarketplaceBrowser />);

    // Wait for error state to fully render
    await waitFor(() => {
      expect(screen.getByText(/Unable to load marketplace listings/)).toBeInTheDocument();
    }, { timeout: TIMEOUT });
  });

  it("displays search & filter heading", async () => {
    mockFetch.mockImplementation(() => mockJsonResponse(mockMarketplaceData));

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      expect(screen.getByText(/Search/)).toBeInTheDocument();
    }, { timeout: TIMEOUT });
  });

  it("renders listing header row", async () => {
    mockFetch.mockImplementation(() => mockJsonResponse(mockMarketplaceData));

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      expect(screen.getByText("Item")).toBeInTheDocument();
      expect(screen.getByText("Price")).toBeInTheDocument();
    }, { timeout: TIMEOUT });
  });

  it("renders listing cards", async () => {
    mockFetch.mockImplementation(() => mockJsonResponse(mockMarketplaceData));

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      const cards = screen.getAllByTestId("listing-card");
      expect(cards.length).toBeGreaterThanOrEqual(1);
    }, { timeout: TIMEOUT });
  });

  it("has search input with correct placeholder", async () => {
    mockFetch.mockImplementation(() => mockJsonResponse(mockMarketplaceData));

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search listings...")).toBeInTheDocument();
    }, { timeout: TIMEOUT });
  });

  it("has category select dropdown", async () => {
    mockFetch.mockImplementation(() => mockJsonResponse(mockMarketplaceData));

    render(<MarketplaceBrowser />);

    await waitFor(() => {
      const comboboxes = screen.getAllByRole("combobox");
      expect(comboboxes.length).toBeGreaterThanOrEqual(1);
    }, { timeout: TIMEOUT });
  });
});
