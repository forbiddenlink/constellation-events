import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  MarketplaceCategory,
  MarketplaceCondition,
  MarketplaceModerationStatus,
  MarketplaceListing
} from "@/lib/marketplace";
import { DEFAULT_MARKETPLACE_LISTINGS } from "@/lib/marketplace";

type CreateListingInput = {
  title: string;
  tag: string;
  category: MarketplaceCategory;
  condition: MarketplaceCondition;
  priceUsd: number;
  city: string;
  shipping: boolean;
  status?: MarketplaceModerationStatus;
  description?: string;
  imageUrl?: string;
};

type UpdateListingInput = Partial<CreateListingInput>;

let cachedListings: MarketplaceListing[] | null = null;
let writeQueue = Promise.resolve();

function getDataDir() {
  return process.env.MARKETPLACE_DATA_DIR || path.join(process.cwd(), "data", "marketplace");
}

function getListingsFilePath() {
  return path.join(getDataDir(), "listings.json");
}

async function ensureLoaded() {
  if (cachedListings) return;

  const filePath = getListingsFilePath();
  try {
    const content = await readFile(filePath, "utf8");
    const parsed = JSON.parse(content) as MarketplaceListing[];
    cachedListings = Array.isArray(parsed)
      ? parsed
          .map((listing) => normalizeMarketplaceListing(listing))
          .filter((listing): listing is MarketplaceListing => Boolean(listing))
      : [];
  } catch {
    cachedListings = [...DEFAULT_MARKETPLACE_LISTINGS];
    await flush();
  }
}

async function flush() {
  const snapshot = cachedListings ?? [];
  const filePath = getListingsFilePath();

  await mkdir(getDataDir(), { recursive: true });

  // Chain the write operation with error recovery to prevent queue breakage
  writeQueue = writeQueue
    .then(() => writeFile(filePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8"))
    .catch((error) => {
      // Log the error but don't reject - this keeps the queue chain intact
      console.error("[marketplace-store] Write failed:", error);
      // Reset queue to allow future writes to proceed
      writeQueue = Promise.resolve();
      throw error; // Re-throw so caller knows the write failed
    });

  await writeQueue;
}

export async function listMarketplaceListings() {
  await ensureLoaded();
  return [...(cachedListings ?? [])];
}

export async function createMarketplaceListing(
  input: CreateListingInput
): Promise<MarketplaceListing> {
  await ensureLoaded();
  const listing: MarketplaceListing = {
    id: buildListingId(),
    title: input.title.trim(),
    tag: input.tag.trim(),
    category: input.category,
    condition: input.condition,
    priceUsd: Math.round(input.priceUsd),
    city: input.city.trim(),
    shipping: Boolean(input.shipping),
    sellerRating: 4.7,
    status: input.status ?? "approved",
    postedAt: new Date().toISOString(),
    description: input.description?.trim() || undefined,
    imageUrl: input.imageUrl?.trim() || undefined
  };

  cachedListings = [listing, ...(cachedListings ?? [])];
  await flush();
  return listing;
}

export async function updateMarketplaceListing(
  id: string,
  patch: UpdateListingInput
): Promise<MarketplaceListing | null> {
  await ensureLoaded();
  const listings = cachedListings ?? [];
  const index = listings.findIndex((listing) => listing.id === id);
  if (index === -1) return null;

  const current = listings[index];
  const updated: MarketplaceListing = {
    ...current,
    ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
    ...(patch.tag !== undefined ? { tag: patch.tag.trim() } : {}),
    ...(patch.category !== undefined ? { category: patch.category } : {}),
    ...(patch.condition !== undefined ? { condition: patch.condition } : {}),
    ...(patch.priceUsd !== undefined ? { priceUsd: Math.round(patch.priceUsd) } : {}),
    ...(patch.city !== undefined ? { city: patch.city.trim() } : {}),
    ...(patch.shipping !== undefined ? { shipping: Boolean(patch.shipping) } : {}),
    ...(patch.description !== undefined ? { description: patch.description.trim() || undefined } : {}),
    ...(patch.imageUrl !== undefined ? { imageUrl: patch.imageUrl.trim() || undefined } : {}),
    updatedAt: new Date().toISOString()
  };

  listings[index] = updated;
  cachedListings = listings;
  await flush();
  return updated;
}

function buildListingId() {
  const base = Math.random().toString(36).slice(2, 8);
  return `mkp-${Date.now().toString(36)}-${base}`;
}

function normalizeMarketplaceListing(
  listing: Partial<MarketplaceListing>
): MarketplaceListing | null {
  if (
    !listing.id ||
    !listing.title ||
    !listing.tag ||
    !listing.category ||
    !listing.condition ||
    !listing.city ||
    !listing.postedAt
  ) {
    return null;
  }

  return {
    id: listing.id,
    title: String(listing.title),
    tag: String(listing.tag),
    category: listing.category,
    condition: listing.condition,
    priceUsd: Math.round(Number(listing.priceUsd ?? 0)),
    city: String(listing.city),
    shipping: Boolean(listing.shipping),
    sellerRating: Number(listing.sellerRating ?? 4.7),
    status:
      listing.status === "approved" ||
      listing.status === "pending" ||
      listing.status === "hidden"
        ? listing.status
        : "approved",
    postedAt: String(listing.postedAt),
    updatedAt: listing.updatedAt ? String(listing.updatedAt) : undefined,
    description: listing.description ? String(listing.description) : undefined,
    imageUrl: listing.imageUrl ? String(listing.imageUrl) : undefined
  };
}

export function __resetMarketplaceStoreForTests() {
  cachedListings = null;
  writeQueue = Promise.resolve();
}
