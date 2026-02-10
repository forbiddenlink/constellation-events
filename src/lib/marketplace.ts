export type MarketplaceCategory =
  | "telescope"
  | "mount"
  | "camera"
  | "eyepiece"
  | "filter"
  | "accessory";

export type MarketplaceCondition = "like-new" | "excellent" | "good" | "fair";
export type MarketplaceModerationStatus = "approved" | "pending" | "hidden";

export type MarketplaceSort = "featured" | "price-asc" | "price-desc" | "newest";

export type MarketplaceListing = {
  id: string;
  title: string;
  tag: string;
  category: MarketplaceCategory;
  condition: MarketplaceCondition;
  priceUsd: number;
  city: string;
  shipping: boolean;
  sellerRating: number;
  status: MarketplaceModerationStatus;
  postedAt: string;
  updatedAt?: string;
  description?: string;
  imageUrl?: string;
};

export type MarketplaceFilters = {
  q?: string;
  category?: MarketplaceCategory | "all";
  condition?: MarketplaceCondition | "all";
  maxPrice?: number;
  sort?: MarketplaceSort;
  limit?: number;
  visibility?: "public" | "all";
};

export const MARKETPLACE_CATEGORIES: Array<{ value: MarketplaceCategory; label: string }> = [
  { value: "telescope", label: "Telescopes" },
  { value: "mount", label: "Mounts" },
  { value: "camera", label: "Cameras" },
  { value: "eyepiece", label: "Eyepieces" },
  { value: "filter", label: "Filters" },
  { value: "accessory", label: "Accessories" }
];

export const MARKETPLACE_CONDITIONS: Array<{ value: MarketplaceCondition; label: string }> = [
  { value: "like-new", label: "Like new" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" }
];

export const DEFAULT_MARKETPLACE_LISTINGS: MarketplaceListing[] = [
  {
    id: "mkp-1",
    title: "Celestron NexStar 8SE GoTo",
    tag: "Motorized tracking",
    category: "telescope",
    condition: "excellent",
    priceUsd: 1090,
    city: "Las Vegas, NV",
    shipping: true,
    sellerRating: 4.9,
    status: "approved",
    postedAt: "2026-02-06T18:00:00.000Z",
    description: "Trusted 8-inch Schmidt-Cassegrain with clean optics and stable tracking."
  },
  {
    id: "mkp-2",
    title: "Sky-Watcher Dobsonian 10\"",
    tag: "Deep-sky favorite",
    category: "telescope",
    condition: "good",
    priceUsd: 620,
    city: "Henderson, NV",
    shipping: false,
    sellerRating: 4.7,
    status: "approved",
    postedAt: "2026-02-04T20:30:00.000Z",
    description: "Solid aperture for faint nebulae. Includes cooling fan and upgraded finder."
  },
  {
    id: "mkp-3",
    title: "ZWO ASI533MC Pro (cooled)",
    tag: "Astrophotography",
    category: "camera",
    condition: "like-new",
    priceUsd: 760,
    city: "Phoenix, AZ",
    shipping: true,
    sellerRating: 5.0,
    status: "approved",
    postedAt: "2026-02-07T01:10:00.000Z",
    description: "Low-noise cooled camera, ideal for narrowband and broadband capture."
  },
  {
    id: "mkp-4",
    title: "iOptron CEM26 Mount",
    tag: "Portable equatorial",
    category: "mount",
    condition: "excellent",
    priceUsd: 950,
    city: "St. George, UT",
    shipping: true,
    sellerRating: 4.8,
    status: "approved",
    postedAt: "2026-02-05T13:40:00.000Z",
    description: "Portable mount with guiding port. Excellent travel rig."
  },
  {
    id: "mkp-5",
    title: "Baader Hyperion Eyepiece Set",
    tag: "Visual observing",
    category: "eyepiece",
    condition: "good",
    priceUsd: 280,
    city: "Flagstaff, AZ",
    shipping: true,
    sellerRating: 4.6,
    status: "approved",
    postedAt: "2026-02-01T09:20:00.000Z",
    description: "Wide range eyepieces with good edge correction."
  },
  {
    id: "mkp-6",
    title: "Optolong L-Extreme 2\" Filter",
    tag: "Narrowband imaging",
    category: "filter",
    condition: "like-new",
    priceUsd: 240,
    city: "Reno, NV",
    shipping: true,
    sellerRating: 4.9,
    status: "approved",
    postedAt: "2026-02-03T16:50:00.000Z",
    description: "Strong city-light rejection for emission nebula imaging."
  },
  {
    id: "mkp-7",
    title: "Dew Heater Controller + Straps",
    tag: "Cold-night essential",
    category: "accessory",
    condition: "excellent",
    priceUsd: 95,
    city: "Salt Lake City, UT",
    shipping: true,
    sellerRating: 4.5,
    status: "approved",
    postedAt: "2026-02-02T22:00:00.000Z",
    description: "Reliable dew prevention kit for long winter sessions."
  },
  {
    id: "mkp-8",
    title: "Canon EOS Ra (astro modified)",
    tag: "Full-frame astro body",
    category: "camera",
    condition: "fair",
    priceUsd: 1450,
    city: "Los Angeles, CA",
    shipping: false,
    sellerRating: 4.4,
    status: "approved",
    postedAt: "2026-01-31T14:00:00.000Z",
    description: "Full-frame body tuned for astronomy with H-alpha sensitivity."
  }
];

export function parseMarketplaceFilters(searchParams: URLSearchParams): MarketplaceFilters {
  const category = searchParams.get("category");
  const condition = searchParams.get("condition");
  const q = searchParams.get("q");
  const sort = searchParams.get("sort");
  const scope = searchParams.get("scope");
  const maxPriceRaw = searchParams.get("maxPrice");
  const limitRaw = searchParams.get("limit");

  const maxPrice = maxPriceRaw ? Number.parseInt(maxPriceRaw, 10) : undefined;
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;

  return {
    q: q?.trim() || undefined,
    category: isCategory(category) ? category : "all",
    condition: isCondition(condition) ? condition : "all",
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    sort: isSort(sort) ? sort : "featured",
    limit: Number.isFinite(limit) ? limit : undefined,
    visibility: scope === "all" ? "all" : "public"
  };
}

export function getMarketplaceListings(
  filters: MarketplaceFilters = {},
  sourceListings: MarketplaceListing[] = DEFAULT_MARKETPLACE_LISTINGS
): MarketplaceListing[] {
  const {
    q,
    category = "all",
    condition = "all",
    maxPrice,
    sort = "featured",
    limit,
    visibility = "public"
  } = filters;

  let listings = sourceListings.filter((listing) => {
    if (visibility === "public" && listing.status !== "approved") return false;
    if (category !== "all" && listing.category !== category) return false;
    if (condition !== "all" && listing.condition !== condition) return false;
    if (typeof maxPrice === "number" && listing.priceUsd > maxPrice) return false;
    if (q) {
      const haystack = `${listing.title} ${listing.tag} ${listing.city} ${listing.description || ""}`.toLowerCase();
      if (!haystack.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  listings = sortListings(listings, sort);

  if (typeof limit === "number" && limit > 0) {
    return listings.slice(0, limit);
  }

  return listings;
}

function sortListings(listings: MarketplaceListing[], sort: MarketplaceSort): MarketplaceListing[] {
  const copy = [...listings];

  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.priceUsd - b.priceUsd);
    case "price-desc":
      return copy.sort((a, b) => b.priceUsd - a.priceUsd);
    case "newest":
      return copy.sort(
        (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
      );
    case "featured":
    default:
      return copy.sort((a, b) => {
        const scoreA = a.sellerRating * 20 + (a.shipping ? 5 : 0) - a.priceUsd / 400;
        const scoreB = b.sellerRating * 20 + (b.shipping ? 5 : 0) - b.priceUsd / 400;
        return scoreB - scoreA;
      });
  }
}

function isCategory(value: string | null): value is MarketplaceCategory {
  return MARKETPLACE_CATEGORIES.some((item) => item.value === value);
}

function isCondition(value: string | null): value is MarketplaceCondition {
  return MARKETPLACE_CONDITIONS.some((item) => item.value === value);
}

function isSort(value: string | null): value is MarketplaceSort {
  return value === "featured" || value === "price-asc" || value === "price-desc" || value === "newest";
}
