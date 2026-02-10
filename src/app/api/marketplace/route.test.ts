import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

async function loadRoute(options?: {
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
  return import("./route");
}

describe("marketplace route", () => {
  afterEach(() => {
    delete process.env.MARKETPLACE_WRITE_TOKEN;
    delete process.env.MARKETPLACE_DATA_DIR;
    delete process.env.MARKETPLACE_WRITE_RATE_LIMIT_MAX;
    delete process.env.MARKETPLACE_WRITE_RATE_LIMIT_WINDOW_MS;
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

  it("rejects POST without token when write-protected", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-route-"));
    const { POST } = await loadRoute({ writeToken: "abc123", dataDir: dir });

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

  it("creates listing with valid write token", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-route-"));
    const { POST } = await loadRoute({ writeToken: "abc123", dataDir: dir });

    const response = await POST(
      new Request("http://localhost/api/marketplace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-marketplace-write-token": "abc123"
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
      listing?: { title?: string; description?: string };
    };

    expect(response.status).toBe(201);
    expect(body.listing?.title).toBe("Example Listing");
    expect(body.listing?.description).toBe("Portable setup");
    expect((body.listing as { status?: string } | undefined)?.status).toBe("pending");
  });

  it("returns pending listings only when scope=all and valid token is provided", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "constellation-mkp-route-"));
    const { GET, POST } = await loadRoute({ writeToken: "abc123", dataDir: dir });

    await POST(
      new Request("http://localhost/api/marketplace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-marketplace-write-token": "abc123"
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
      writeToken: "abc123",
      dataDir: dir,
      rateLimitMax: "1",
      rateLimitWindowMs: "60000"
    });

    const buildRequest = () =>
      new Request("http://localhost/api/marketplace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-marketplace-write-token": "abc123",
          "x-forwarded-for": "203.0.113.10"
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
