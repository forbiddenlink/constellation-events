import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockMarketplaceSession } from "@/test/mock-marketplace-session";

async function loadPatchRoute(options?: {
  dataDir?: string;
  rateLimitMax?: string;
  rateLimitWindowMs?: string;
  adminUserIds?: string;
  sessionUser?: { id: string } | null;
}) {
  vi.resetModules();
  if (options?.dataDir !== undefined) {
    process.env.MARKETPLACE_DATA_DIR = options.dataDir;
  } else {
    delete process.env.MARKETPLACE_DATA_DIR;
  }
  if (options?.rateLimitMax !== undefined) {
    process.env.MARKETPLACE_WRITE_RATE_LIMIT_MAX = options.rateLimitMax;
  } else {
    delete process.env.MARKETPLACE_WRITE_RATE_LIMIT_MAX;
  }
  if (options?.rateLimitWindowMs !== undefined) {
    process.env.MARKETPLACE_WRITE_RATE_LIMIT_WINDOW_MS = options.rateLimitWindowMs;
  } else {
    delete process.env.MARKETPLACE_WRITE_RATE_LIMIT_WINDOW_MS;
  }
  if (options?.adminUserIds !== undefined) {
    process.env.MARKETPLACE_ADMIN_USER_IDS = options.adminUserIds;
  } else {
    delete process.env.MARKETPLACE_ADMIN_USER_IDS;
  }
  mockMarketplaceSession(options?.sessionUser === undefined ? null : options.sessionUser);
  const route = await import("./route");
  const store = await import("@/lib/marketplace-store");
  return { ...route, ...store };
}

describe("marketplace id route", () => {
  afterEach(() => {
    delete process.env.MARKETPLACE_DATA_DIR;
    delete process.env.MARKETPLACE_WRITE_RATE_LIMIT_MAX;
    delete process.env.MARKETPLACE_WRITE_RATE_LIMIT_WINDOW_MS;
    delete process.env.MARKETPLACE_ADMIN_USER_IDS;
    vi.restoreAllMocks();
  });

  it("rejects PATCH from an anonymous (no session) request", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-patch-"));
    const { PATCH } = await loadPatchRoute({ dataDir: dir, sessionUser: null });

    const response = await PATCH(
      new Request("http://localhost/api/marketplace/missing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceUsd: 450 })
      }),
      { params: Promise.resolve({ id: "nonexistent" }) }
    );

    expect(response.status).toBe(401);
  });

  it("lets the owning session user update their own listing", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-patch-"));
    const { PATCH, createMarketplaceListing } = await loadPatchRoute({
      dataDir: dir,
      sessionUser: { id: "user-1" }
    });
    const created = await createMarketplaceListing({
      title: "Patch Test Listing",
      tag: "Visual",
      category: "telescope",
      condition: "good",
      priceUsd: 420,
      city: "Reno, NV",
      shipping: true,
      sellerId: "user-1"
    });

    const response = await PATCH(
      new Request(`http://localhost/api/marketplace/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000"
        },
        body: JSON.stringify({ priceUsd: 499, condition: "excellent" })
      }),
      { params: Promise.resolve({ id: created.id }) }
    );

    const body = (await response.json()) as {
      listing?: { priceUsd?: number; condition?: string };
    };

    expect(response.status).toBe(200);
    expect(body.listing?.priceUsd).toBe(499);
    expect(body.listing?.condition).toBe("excellent");
  });

  it("rejects a signed-in user editing someone else's listing (403)", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-patch-"));
    const { PATCH, createMarketplaceListing } = await loadPatchRoute({
      dataDir: dir,
      sessionUser: { id: "user-2" }
    });
    const created = await createMarketplaceListing({
      title: "Owned By Someone Else",
      tag: "Visual",
      category: "telescope",
      condition: "good",
      priceUsd: 420,
      city: "Reno, NV",
      shipping: true,
      sellerId: "user-1"
    });

    const response = await PATCH(
      new Request(`http://localhost/api/marketplace/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000"
        },
        body: JSON.stringify({ priceUsd: 1 })
      }),
      { params: Promise.resolve({ id: created.id }) }
    );

    expect(response.status).toBe(403);
  });

  it("rejects a non-admin editing a legacy listing with no sellerId (403)", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-patch-"));
    const { PATCH, createMarketplaceListing } = await loadPatchRoute({
      dataDir: dir,
      sessionUser: { id: "user-1" }
    });
    const created = await createMarketplaceListing({
      title: "Legacy Listing",
      tag: "Visual",
      category: "telescope",
      condition: "good",
      priceUsd: 420,
      city: "Reno, NV",
      shipping: true
      // no sellerId - simulates seed data / pre-ownership listings
    });

    const response = await PATCH(
      new Request(`http://localhost/api/marketplace/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000"
        },
        body: JSON.stringify({ priceUsd: 1 })
      }),
      { params: Promise.resolve({ id: created.id }) }
    );

    expect(response.status).toBe(403);
  });

  it("lets an admin moderate (change status on) any listing, including legacy ones", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-patch-"));
    const { PATCH, createMarketplaceListing } = await loadPatchRoute({
      dataDir: dir,
      adminUserIds: "admin-1",
      sessionUser: { id: "admin-1" }
    });
    const created = await createMarketplaceListing({
      title: "Legacy Listing",
      tag: "Visual",
      category: "telescope",
      condition: "good",
      priceUsd: 420,
      city: "Reno, NV",
      shipping: true
    });

    const response = await PATCH(
      new Request(`http://localhost/api/marketplace/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000"
        },
        body: JSON.stringify({ status: "hidden" })
      }),
      { params: Promise.resolve({ id: created.id }) }
    );

    const body = (await response.json()) as { listing?: { status?: string } };
    expect(response.status).toBe(200);
    expect(body.listing?.status).toBe("hidden");
  });

  it("rejects a listing owner changing moderation status (admin-only)", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-patch-"));
    const { PATCH, createMarketplaceListing } = await loadPatchRoute({
      dataDir: dir,
      sessionUser: { id: "user-1" }
    });
    const created = await createMarketplaceListing({
      title: "Owner Listing",
      tag: "Visual",
      category: "telescope",
      condition: "good",
      priceUsd: 420,
      city: "Reno, NV",
      shipping: true,
      sellerId: "user-1"
    });
    expect(created.status).toBe("approved");

    const response = await PATCH(
      new Request(`http://localhost/api/marketplace/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000"
        },
        body: JSON.stringify({ status: "hidden" })
      }),
      { params: Promise.resolve({ id: created.id }) }
    );

    expect(response.status).toBe(403);
  });

  it("allows a listing owner to edit other fields while echoing the current status", async () => {
    // The seller edit form always sends status back in its PATCH body, even
    // when the seller did not touch it. Only an actual status CHANGE is a
    // moderation action - echoing the current value must not 403 a normal edit.
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-patch-"));
    const { PATCH, createMarketplaceListing } = await loadPatchRoute({
      dataDir: dir,
      sessionUser: { id: "user-1" }
    });
    const created = await createMarketplaceListing({
      title: "Owner Listing",
      tag: "Visual",
      category: "telescope",
      condition: "good",
      priceUsd: 420,
      city: "Reno, NV",
      shipping: true,
      sellerId: "user-1"
    });
    expect(created.status).toBe("approved");

    const response = await PATCH(
      new Request(`http://localhost/api/marketplace/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000"
        },
        body: JSON.stringify({ priceUsd: 399, status: "approved" })
      }),
      { params: Promise.resolve({ id: created.id }) }
    );

    const body = (await response.json()) as { listing?: { priceUsd?: number } };
    expect(response.status).toBe(200);
    expect(body.listing?.priceUsd).toBe(399);
  });

  it("returns 404 for unknown listing id", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-patch-"));
    const { PATCH } = await loadPatchRoute({ dataDir: dir, sessionUser: { id: "user-1" } });

    const response = await PATCH(
      new Request("http://localhost/api/marketplace/does-not-exist", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000"
        },
        body: JSON.stringify({ priceUsd: 350 })
      }),
      { params: Promise.resolve({ id: "does-not-exist" }) }
    );

    expect(response.status).toBe(404);
  });

  it("rate limits repeated PATCH requests from same client", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-patch-"));
    const { PATCH, createMarketplaceListing } = await loadPatchRoute({
      dataDir: dir,
      rateLimitMax: "1",
      rateLimitWindowMs: "60000",
      sessionUser: { id: "user-1" }
    });
    const created = await createMarketplaceListing({
      title: "Rate Limit Patch Listing",
      tag: "Visual",
      category: "telescope",
      condition: "good",
      priceUsd: 420,
      city: "Reno, NV",
      shipping: true,
      sellerId: "user-1"
    });

    const buildRequest = () =>
      new Request(`http://localhost/api/marketplace/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.20",
          Origin: "http://localhost:3000"
        },
        body: JSON.stringify({ priceUsd: 430 })
      });

    const first = await PATCH(buildRequest(), { params: Promise.resolve({ id: created.id }) });
    const second = await PATCH(buildRequest(), { params: Promise.resolve({ id: created.id }) });

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
  });

  describe("DELETE", () => {
    it("rejects DELETE from an anonymous (no session) request", async () => {
      const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-delete-"));
      const { DELETE } = await loadPatchRoute({ dataDir: dir, sessionUser: null });

      const response = await DELETE(
        new Request("http://localhost/api/marketplace/missing", {
          method: "DELETE",
          headers: { Origin: "http://localhost:3000" }
        }),
        { params: Promise.resolve({ id: "nonexistent" }) }
      );

      expect(response.status).toBe(401);
    });

    it("lets the owning session user delete their own listing", async () => {
      const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-delete-"));
      const { DELETE, createMarketplaceListing, getMarketplaceListingById } =
        await loadPatchRoute({ dataDir: dir, sessionUser: { id: "user-1" } });
      const created = await createMarketplaceListing({
        title: "Owner Listing",
        tag: "Visual",
        category: "telescope",
        condition: "good",
        priceUsd: 420,
        city: "Reno, NV",
        shipping: true,
        sellerId: "user-1"
      });

      const response = await DELETE(
        new Request(`http://localhost/api/marketplace/${created.id}`, {
          method: "DELETE",
          headers: { Origin: "http://localhost:3000" }
        }),
        { params: Promise.resolve({ id: created.id }) }
      );

      expect(response.status).toBe(200);
      expect(await getMarketplaceListingById(created.id)).toBeNull();
    });

    it("rejects a signed-in user deleting someone else's listing (403)", async () => {
      const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-delete-"));
      const { DELETE, createMarketplaceListing } = await loadPatchRoute({
        dataDir: dir,
        sessionUser: { id: "user-2" }
      });
      const created = await createMarketplaceListing({
        title: "Owned By Someone Else",
        tag: "Visual",
        category: "telescope",
        condition: "good",
        priceUsd: 420,
        city: "Reno, NV",
        shipping: true,
        sellerId: "user-1"
      });

      const response = await DELETE(
        new Request(`http://localhost/api/marketplace/${created.id}`, {
          method: "DELETE",
          headers: { Origin: "http://localhost:3000" }
        }),
        { params: Promise.resolve({ id: created.id }) }
      );

      expect(response.status).toBe(403);
    });

    it("lets an admin delete a legacy listing with no sellerId", async () => {
      const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-delete-"));
      const { DELETE, createMarketplaceListing, getMarketplaceListingById } =
        await loadPatchRoute({
          dataDir: dir,
          adminUserIds: "admin-1",
          sessionUser: { id: "admin-1" }
        });
      const created = await createMarketplaceListing({
        title: "Legacy Listing",
        tag: "Visual",
        category: "telescope",
        condition: "good",
        priceUsd: 420,
        city: "Reno, NV",
        shipping: true
      });

      const response = await DELETE(
        new Request(`http://localhost/api/marketplace/${created.id}`, {
          method: "DELETE",
          headers: { Origin: "http://localhost:3000" }
        }),
        { params: Promise.resolve({ id: created.id }) }
      );

      expect(response.status).toBe(200);
      expect(await getMarketplaceListingById(created.id)).toBeNull();
    });

    it("returns 404 deleting an unknown listing id", async () => {
      const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-delete-"));
      const { DELETE } = await loadPatchRoute({ dataDir: dir, sessionUser: { id: "user-1" } });

      const response = await DELETE(
        new Request("http://localhost/api/marketplace/does-not-exist", {
          method: "DELETE",
          headers: { Origin: "http://localhost:3000" }
        }),
        { params: Promise.resolve({ id: "does-not-exist" }) }
      );

      expect(response.status).toBe(404);
    });
  });
});
