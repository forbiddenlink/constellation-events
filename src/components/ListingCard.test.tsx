import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ListingCard from "./ListingCard";
import type { MarketplaceListing } from "@/lib/marketplace";
import type { ListingItem } from "@/lib/mock";

describe("ListingCard", () => {
  const mockMarketplaceListing: MarketplaceListing = {
    id: "mkp-1",
    title: "Celestron NexStar 8SE",
    tag: "Motorized tracking",
    category: "telescope",
    condition: "excellent",
    priceUsd: 1090,
    city: "Las Vegas, NV",
    shipping: true,
    sellerRating: 4.9,
    status: "approved",
    postedAt: "2026-02-06T18:00:00.000Z",
    imageUrl: "/images/telescope.jpg"
  };

  const mockListingItem: ListingItem = {
    id: "list-1",
    title: "Sky-Watcher Dobsonian",
    price: "$420",
    condition: "Very good",
    tag: "Beginner friendly"
  };

  it("renders listing title", () => {
    render(<ListingCard listing={mockMarketplaceListing} />);

    expect(screen.getByText("Celestron NexStar 8SE")).toBeInTheDocument();
  });

  it("renders tag", () => {
    render(<ListingCard listing={mockMarketplaceListing} />);

    expect(screen.getByText("Motorized tracking")).toBeInTheDocument();
  });

  it("renders formatted condition for MarketplaceListing", () => {
    render(<ListingCard listing={mockMarketplaceListing} />);

    expect(screen.getByText("Excellent")).toBeInTheDocument();
  });

  it("renders formatted price for MarketplaceListing", () => {
    render(<ListingCard listing={mockMarketplaceListing} />);

    expect(screen.getByText("$1,090")).toBeInTheDocument();
  });

  it("renders price for ListingItem format", () => {
    render(<ListingCard listing={mockListingItem} />);

    expect(screen.getByText("$420")).toBeInTheDocument();
  });

  it("renders moderation status for approved listings", () => {
    render(<ListingCard listing={mockMarketplaceListing} />);

    expect(screen.getByText("approved")).toBeInTheDocument();
  });

  it("renders moderation status for pending listings", () => {
    const pendingListing = { ...mockMarketplaceListing, status: "pending" as const };
    render(<ListingCard listing={pendingListing} />);

    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("renders moderation status for hidden listings", () => {
    const hiddenListing = { ...mockMarketplaceListing, status: "hidden" as const };
    render(<ListingCard listing={hiddenListing} />);

    expect(screen.getByText("hidden")).toBeInTheDocument();
  });

  it("applies correct status color for approved", () => {
    render(<LocationCardHelper listing={mockMarketplaceListing} />);

    const status = screen.getByText("approved");
    expect(status).toHaveClass("text-success");
  });

  it("applies correct status color for pending", () => {
    const pendingListing = { ...mockMarketplaceListing, status: "pending" as const };
    render(<LocationCardHelper listing={pendingListing} />);

    const status = screen.getByText("pending");
    expect(status).toHaveClass("text-caution");
  });

  it("applies correct status color for hidden", () => {
    const hiddenListing = { ...mockMarketplaceListing, status: "hidden" as const };
    render(<LocationCardHelper listing={hiddenListing} />);

    const status = screen.getByText("hidden");
    expect(status).toHaveClass("text-ember");
  });

  it("does not render moderation status for ListingItem", () => {
    render(<ListingCard listing={mockListingItem} />);

    expect(screen.queryByText(/^approved$|^pending$|^hidden$/)).not.toBeInTheDocument();
  });

  it("renders chevron icon", () => {
    const { container } = render(<ListingCard listing={mockMarketplaceListing} />);

    const chevron = container.querySelector("svg[aria-hidden='true']");
    expect(chevron).toBeInTheDocument();
  });

  it("applies hover styling classes", () => {
    const { container } = render(<ListingCard listing={mockMarketplaceListing} />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("hover:bg-white/5");
  });

  it("formats like-new condition correctly", () => {
    const likeNewListing = { ...mockMarketplaceListing, condition: "like-new" as const };
    render(<ListingCard listing={likeNewListing} />);

    expect(screen.getByText("Like new")).toBeInTheDocument();
  });

  it("formats good condition correctly", () => {
    const goodListing = { ...mockMarketplaceListing, condition: "good" as const };
    render(<ListingCard listing={goodListing} />);

    expect(screen.getByText("Good")).toBeInTheDocument();
  });

  it("formats fair condition correctly", () => {
    const fairListing = { ...mockMarketplaceListing, condition: "fair" as const };
    render(<ListingCard listing={fairListing} />);

    expect(screen.getByText("Fair")).toBeInTheDocument();
  });
});

// Helper component to test ListingCard (re-renders with same props)
function LocationCardHelper({ listing }: { listing: MarketplaceListing }) {
  return <ListingCard listing={listing} />;
}
