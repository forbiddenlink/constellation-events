import { afterEach, describe, expect, it } from "vitest";
import { isAllowedMarketplaceImageUrl, isValidHttpUrl } from "@/lib/marketplace-images";

describe("isValidHttpUrl", () => {
  it("accepts http/https urls", () => {
    expect(isValidHttpUrl("https://example.com/a.jpg")).toBe(true);
    expect(isValidHttpUrl("http://example.com/a.jpg")).toBe(true);
  });

  it("rejects non-http protocols and malformed urls", () => {
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isValidHttpUrl("ftp://example.com/a.jpg")).toBe(false);
    expect(isValidHttpUrl("not a url")).toBe(false);
  });
});

describe("isAllowedMarketplaceImageUrl", () => {
  afterEach(() => {
    delete process.env.MARKETPLACE_IMAGE_PUBLIC_BASE;
    delete process.env.R2_PUBLIC_BASE;
    delete process.env.MARKETPLACE_IMAGE_ALLOW_EXTERNAL;
  });

  it("denies arbitrary external URLs by default when no public base is configured", () => {
    // Regression: this previously fail-opened (returned true for ANY http/https
    // URL) whenever image storage was not configured, silently disabling the
    // domain allowlist instead of denying by default.
    expect(isAllowedMarketplaceImageUrl("https://evil.example/tracker.png")).toBe(false);
  });

  it("allows external URLs when explicitly opted in", () => {
    process.env.MARKETPLACE_IMAGE_ALLOW_EXTERNAL = "true";
    expect(isAllowedMarketplaceImageUrl("https://evil.example/tracker.png")).toBe(true);
  });

  it("restricts to the configured public base when set", () => {
    process.env.MARKETPLACE_IMAGE_PUBLIC_BASE = "https://cdn.example.com/images";
    expect(isAllowedMarketplaceImageUrl("https://cdn.example.com/images/foo.jpg")).toBe(true);
    expect(isAllowedMarketplaceImageUrl("https://evil.example/tracker.png")).toBe(false);
  });

  it("falls back to R2_PUBLIC_BASE when MARKETPLACE_IMAGE_PUBLIC_BASE is unset", () => {
    process.env.R2_PUBLIC_BASE = "https://r2.example.com/bucket";
    expect(isAllowedMarketplaceImageUrl("https://r2.example.com/bucket/foo.jpg")).toBe(true);
    expect(isAllowedMarketplaceImageUrl("https://evil.example/tracker.png")).toBe(false);
  });
});
