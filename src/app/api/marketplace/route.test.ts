import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockMarketplaceSession } from "@/test/mock-marketplace-session";

async function loadRoute(options?: {
  writeToken?: string;
  dataDir?: string;
  rateLimitMax?: string;
  rateLimitWindowMs?: string;
  adminUserIds?: string;
  sessionUser?: { id: string } | null;
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
  if (options?.adminUserIds !== undefined) {
    process.env.MARKETPLACE_ADMIN_USER_IDS = options.adminUserIds;
  } else {
    delete process.env.MARKETPLACE_ADMIN_USER_IDS;
  }
  mockMarketplaceSession(options?.sessionUser === undefined ? null : options.sessionUser);
  return import("./route");
}

describe("marketplace route", () => {
  afterEach(() => {
    delete process.env.MARKETPLACE_WRITE_TOKEN;
    delete process.env.MARKETPLACE_DATA_DIR;
    delete process.env.MARKETPLACE_WRITE_RATE_LIMIT_MAX;
    delete process.env.MARKETPLACE_WRITE_RATE_LIMIT_WINDOW_MS;
    delete process.env.MARKETPLACE_ADMIN_USER_IDS;
    vi.restoreAllMocks();
  });

  it("reports write protection metadata in GET", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-route-"));
    const { GET } = await loadRoute({ writeToken: "abc123", dataDir: dir });

    const response = await GET(new Request("http://localhost/api/marketplace"));
    const body = (await response.json()) as {
      auth?: { writeProtected?: boolean; tokenHeader?: string };
      listings?: unknown[];
    };

    expect(response.status).toBe(200);
    expect(body.auth?.writeProtected).toBe(true);
    expect(body.auth?.tokenHeader).toBe("x-marketplace-write-token");
    expect(Array.isArray(body.listings)).toBe(true);
  });

  it("rejects POST from an anonymous (no session) request", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-route-"));
    const { POST } = await loadRoute({ dataDir: dir, sessionUser: null });

    const response = await POST(
      new Request("http://localhost/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Example Listing",
          tag: "Visual",
          category: "telescope",
          condition: "good",
          priceUsd: 600,
          city: "Las Vegas, NV",
          shipping: true
        })
      })
    );

    expect(response.status).toBe(401);
  });

  it("creates a listing owned by the signed-in session user, pending review", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-route-"));
    const { POST } = await loadRoute({
      dataDir: dir,
      sessionUser: { id: "user-1" }
    });

    const response = await POST(
      new Request("http://localhost/api/marketplace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000"
        },
        body: JSON.stringify({
          title: "Example Listing",
          tag: "Visual",
          category: "telescope",
          condition: "good",
          priceUsd: 600,
          city: "Las Vegas, NV",
          shipping: true,
          description: "Portable setup"
        })
      })
    );

    const body = (await response.json()) as {
      listing?: { title?: string; description?: string; status?: string; sellerId?: string };
    };

    expect(response.status).toBe(201);
    expect(body.listing?.title).toBe("Example Listing");
    expect(body.listing?.description).toBe("Portable setup");
    expect(body.listing?.status).toBe("pending");
    expect(body.listing?.sellerId).toBe("user-1");
  });

  it("creates an approved listing when the session user is an admin", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-route-"));
    const { POST } = await loadRoute({
      dataDir: dir,
      adminUserIds: "admin-1",
      sessionUser: { id: "admin-1" }
    });

    const response = await POST(
      new Request("http://localhost/api/marketplace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000"
        },
        body: JSON.stringify({
          title: "Admin Listing",
          tag: "Visual",
          category: "telescope",
          condition: "good",
          priceUsd: 600,
          city: "Las Vegas, NV",
          shipping: true
        })
      })
    );

    const body = (await response.json()) as { listing?: { status?: string } };
    expect(response.status).toBe(201);
    expect(body.listing?.status).toBe("approved");
  });

  it("returns pending listings only when scope=all and valid token is provided", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-route-"));
    const { GET, POST } = await loadRoute({
      writeToken: "abc123",
      dataDir: dir,
      sessionUser: { id: "user-1" }
    });

    await POST(
      new Request("http://localhost/api/marketplace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000"
        },
        body: JSON.stringify({
          title: "Pending Listing",
          tag: "Visual",
          category: "telescope",
          condition: "good",
          priceUsd: 700,
          city: "Las Vegas, NV",
          shipping: true
        })
      })
    );

    const publicRes = await GET(new Request("http://localhost/api/marketplace"));
    const publicBody = (await publicRes.json()) as {
      listings: Array<{ title: string; status: string }>;
    };

    const scopedRes = await GET(
      new Request("http://localhost/api/marketplace?scope=all", {
        headers: {
          "x-marketplace-write-token": "abc123"
        }
      })
    );
    const scopedBody = (await scopedRes.json()) as {
      listings: Array<{ title: string; status: string }>;
    };

    expect(publicBody.listings.some((listing) => listing.status === "pending")).toBe(false);
    expect(scopedBody.listings.some((listing) => listing.status === "pending")).toBe(true);
  });

  it("rate limits repeated POST requests from same client", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-route-"));
    const { POST } = await loadRoute({
      dataDir: dir,
      rateLimitMax: "1",
      rateLimitWindowMs: "60000",
      sessionUser: { id: "user-1" }
    });

    const buildRequest = () =>
      new Request("http://localhost/api/marketplace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.10",
          Origin: "http://localhost:3000"
        },
        body: JSON.stringify({
          title: "Rate Limit Listing",
          tag: "Visual",
          category: "telescope",
          condition: "good",
          priceUsd: 600,
          city: "Las Vegas, NV",
          shipping: true
        })
      });

    const first = await POST(buildRequest());
    const second = await POST(buildRequest());

    expect(first.status).toBe(201);
    expect(second.status).toBe(429);
  });
});
