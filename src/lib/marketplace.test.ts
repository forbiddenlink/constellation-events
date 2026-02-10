import { describe, expect, it } from "vitest";
import { getMarketplaceListings, parseMarketplaceFilters } from "./marketplace";

describe("marketplace filters", () => {
  it("parses defaults when query params are missing", () => {
    const filters = parseMarketplaceFilters(new URLSearchParams());

    expect(filters.category).toBe("all");
    expect(filters.condition).toBe("all");
    expect(filters.sort).toBe("featured");
    expect(filters.maxPrice).toBeUndefined();
    expect(filters.visibility).toBe("public");
  });

  it("filters by category and price", () => {
    const listings = getMarketplaceListings({
      category: "camera",
      maxPrice: 1000,
      sort: "price-asc"
    });

    expect(listings).toHaveLength(1);
    expect(listings[0].id).toBe("mkp-3");
  });

  it("searches by text and sorts ascending", () => {
    const listings = getMarketplaceListings({
      q: "astro",
      sort: "price-asc"
    });

    expect(listings.length).toBeGreaterThan(0);
    expect(listings[0].priceUsd).toBeLessThanOrEqual(listings[listings.length - 1].priceUsd);
  });

  it("hides non-approved listings in public mode", () => {
    const listings = getMarketplaceListings(
      { visibility: "public" },
      [
        {
          id: "a",
          title: "Approved listing",
          tag: "A",
          category: "camera",
          condition: "good",
          priceUsd: 100,
          city: "A",
          shipping: true,
          sellerRating: 4,
          status: "approved",
          postedAt: new Date().toISOString()
        },
        {
          id: "b",
          title: "Pending listing",
          tag: "B",
          category: "camera",
          condition: "good",
          priceUsd: 100,
          city: "B",
          shipping: true,
          sellerRating: 4,
          status: "pending",
          postedAt: new Date().toISOString()
        }
      ]
    );

    expect(listings).toHaveLength(1);
    expect(listings[0].id).toBe("a");
  });
});
