import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

async function loadStore(dataDir: string) {
  vi.resetModules();
  process.env.MARKETPLACE_DATA_DIR = dataDir;
  return import("./marketplace-store");
}

describe("marketplace store", () => {
  afterEach(() => {
    delete process.env.MARKETPLACE_DATA_DIR;
    vi.restoreAllMocks();
  });

  it("boots with seeded listings when no file exists", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-"));
    const store = await loadStore(dir);

    const listings = await store.listMarketplaceListings();
    expect(listings.length).toBeGreaterThan(0);
  });

  it("creates and updates a listing", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-"));
    const store = await loadStore(dir);

    const created = await store.createMarketplaceListing({
      title: "Test Listing Scope",
      tag: "Visual",
      category: "telescope",
      condition: "good",
      priceUsd: 450,
      city: "Test City, NV",
      shipping: true
    });

    expect(created.id).toContain("mkp-");
    expect(created.title).toBe("Test Listing Scope");
    expect(created.status).toBe("approved");

    const updated = await store.updateMarketplaceListing(created.id, {
      priceUsd: 499,
      condition: "excellent"
    });

    expect(updated).not.toBeNull();
    expect(updated?.priceUsd).toBe(499);
    expect(updated?.condition).toBe("excellent");
  });

  it("normalizes legacy listings without moderation status", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-"));
    const dataDir = path.join(dir, "marketplace");
    await mkdir(dataDir, { recursive: true });
    await writeFile(
      path.join(dataDir, "listings.json"),
      JSON.stringify(
        [
          {
            id: "legacy-1",
            title: "Legacy Listing",
            tag: "Legacy",
            category: "camera",
            condition: "good",
            priceUsd: 320,
            city: "Legacy City",
            shipping: true,
            sellerRating: 4.2,
            postedAt: new Date().toISOString()
          }
        ],
        null,
        2
      )
    );
    const store = await loadStore(dataDir);

    const listings = await store.listMarketplaceListings();
    expect(listings).toHaveLength(1);
    expect(listings[0].status).toBe("approved");
  });
});
