import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

async function loadPatchRoute(options?: {
  writeToken?: string;
  dataDir?: string;
  rateLimitMax?: string;
  rateLimitWindowMs?: string;
}) {
  vi.resetModules();
  if (options?.writeToken !== undefined) {
    process.env.MARKETPLACE_WRITE_TOKEN = options.writeToken;
  } else {
    delete process.env.MARKETPLACE_WRITE_TOKEN;
  }
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
  const route = await import("./route");
  const store = await import("@/lib/marketplace-store");
  return { ...route, ...store };
}

describe("marketplace id route", () => {
  afterEach(() => {
    delete process.env.MARKETPLACE_WRITE_TOKEN;
    delete process.env.MARKETPLACE_DATA_DIR;
    delete process.env.MARKETPLACE_WRITE_RATE_LIMIT_MAX;
    delete process.env.MARKETPLACE_WRITE_RATE_LIMIT_WINDOW_MS;
    vi.restoreAllMocks();
  });

  it("rejects PATCH without write token when protected", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-patch-"));
    const { PATCH } = await loadPatchRoute({ writeToken: "abc123", dataDir: dir });

    const response = await PATCH(
      new Request("http://localhost/api/marketplace/missing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceUsd: 450 })
      }),
      { params: { id: "missing" } }
    );

    expect(response.status).toBe(401);
  });

  it("updates an existing listing with valid token", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-patch-"));
    const { PATCH, createMarketplaceListing } = await loadPatchRoute({
      writeToken: "abc123",
      dataDir: dir
    });
    const created = await createMarketplaceListing({
      title: "Patch Test Listing",
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
          "x-marketplace-write-token": "abc123"
        },
        body: JSON.stringify({ priceUsd: 499, condition: "excellent" })
      }),
      { params: { id: created.id } }
    );

    const body = (await response.json()) as {
      listing?: { priceUsd?: number; condition?: string };
    };

    expect(response.status).toBe(200);
    expect(body.listing?.priceUsd).toBe(499);
    expect(body.listing?.condition).toBe("excellent");
  });

  it("returns 404 for unknown listing id", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-patch-"));
    const { PATCH } = await loadPatchRoute({ writeToken: "abc123", dataDir: dir });

    const response = await PATCH(
      new Request("http://localhost/api/marketplace/does-not-exist", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-marketplace-write-token": "abc123"
        },
        body: JSON.stringify({ priceUsd: 350 })
      }),
      { params: { id: "does-not-exist" } }
    );

    expect(response.status).toBe(404);
  });

  it("rate limits repeated PATCH requests from same client", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-patch-"));
    const { PATCH, createMarketplaceListing } = await loadPatchRoute({
      writeToken: "abc123",
      dataDir: dir,
      rateLimitMax: "1",
      rateLimitWindowMs: "60000"
    });
    const created = await createMarketplaceListing({
      title: "Rate Limit Patch Listing",
      tag: "Visual",
      category: "telescope",
      condition: "good",
      priceUsd: 420,
      city: "Reno, NV",
      shipping: true
    });

    const buildRequest = () =>
      new Request(`http://localhost/api/marketplace/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-marketplace-write-token": "abc123",
          "x-forwarded-for": "203.0.113.20"
        },
        body: JSON.stringify({ priceUsd: 430 })
      });

    const first = await PATCH(buildRequest(), { params: { id: created.id } });
    const second = await PATCH(buildRequest(), { params: { id: created.id } });

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
  });
});
