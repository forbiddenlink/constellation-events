import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getMarketplaceWriteAuth, isMarketplaceWriteProtected, validateOrigin } from "./marketplace-auth";

describe("marketplace write auth", () => {
  afterEach(() => {
    delete process.env.MARKETPLACE_WRITE_TOKEN;
  });

  it("allows writes when token is not configured", () => {
    const request = new Request("http://localhost/api/marketplace", { method: "POST" });
    const auth = getMarketplaceWriteAuth(request);

    expect(auth.allowed).toBe(true);
    expect(auth.writeProtected).toBe(false);
    expect(isMarketplaceWriteProtected()).toBe(false);
  });

  it("requires matching token when configured", () => {
    process.env.MARKETPLACE_WRITE_TOKEN = "secret-token";

    const denied = getMarketplaceWriteAuth(
      new Request("http://localhost/api/marketplace", { method: "POST" })
    );
    const allowed = getMarketplaceWriteAuth(
      new Request("http://localhost/api/marketplace", {
        method: "POST",
        headers: {
          "x-marketplace-write-token": "secret-token"
        }
      })
    );

    expect(denied.allowed).toBe(false);
    expect(denied.writeProtected).toBe(true);
    expect(allowed.allowed).toBe(true);
    expect(allowed.writeProtected).toBe(true);
    expect(isMarketplaceWriteProtected()).toBe(true);
  });

  it("rejects tokens with wrong length (timing-safe)", () => {
    process.env.MARKETPLACE_WRITE_TOKEN = "correct-token";

    const shortToken = getMarketplaceWriteAuth(
      new Request("http://localhost/api/marketplace", {
        method: "POST",
        headers: { "x-marketplace-write-token": "short" }
      })
    );
    const longToken = getMarketplaceWriteAuth(
      new Request("http://localhost/api/marketplace", {
        method: "POST",
        headers: { "x-marketplace-write-token": "this-is-a-very-long-token-that-doesnt-match" }
      })
    );

    expect(shortToken.allowed).toBe(false);
    expect(longToken.allowed).toBe(false);
  });

  it("rejects empty tokens", () => {
    process.env.MARKETPLACE_WRITE_TOKEN = "secret-token";

    const emptyToken = getMarketplaceWriteAuth(
      new Request("http://localhost/api/marketplace", {
        method: "POST",
        headers: { "x-marketplace-write-token": "" }
      })
    );
    const whitespaceToken = getMarketplaceWriteAuth(
      new Request("http://localhost/api/marketplace", {
        method: "POST",
        headers: { "x-marketplace-write-token": "   " }
      })
    );

    expect(emptyToken.allowed).toBe(false);
    expect(whitespaceToken.allowed).toBe(false);
  });
});

describe("origin validation", () => {
  beforeEach(() => {
    process.env.MARKETPLACE_WRITE_TOKEN = "test-token";
    process.env.MARKETPLACE_ALLOWED_ORIGINS = "https://example.com,https://app.example.com";
  });

  afterEach(() => {
    delete process.env.MARKETPLACE_WRITE_TOKEN;
    delete process.env.MARKETPLACE_ALLOWED_ORIGINS;
  });

  it("allows exact origin match", () => {
    const request = new Request("http://localhost/api/marketplace", {
      method: "POST",
      headers: { origin: "https://example.com" }
    });

    const result = validateOrigin(request);
    expect(result.valid).toBe(true);
    expect(result.origin).toBe("https://example.com");
  });

  it("allows subdomain of allowed origin", () => {
    const request = new Request("http://localhost/api/marketplace", {
      method: "POST",
      headers: { origin: "https://api.example.com" }
    });

    const result = validateOrigin(request);
    expect(result.valid).toBe(true);
  });

  it("rejects origins that only end with allowed hostname as string", () => {
    // This was the security bug: "https://evil.com?x=.example.com" would pass
    const request = new Request("http://localhost/api/marketplace", {
      method: "POST",
      headers: { origin: "https://evil-example.com" }
    });

    const result = validateOrigin(request);
    expect(result.valid).toBe(false);
  });

  it("rejects completely different origins", () => {
    const request = new Request("http://localhost/api/marketplace", {
      method: "POST",
      headers: { origin: "https://attacker.com" }
    });

    const result = validateOrigin(request);
    expect(result.valid).toBe(false);
  });

  it("uses referer as fallback when origin missing", () => {
    const request = new Request("http://localhost/api/marketplace", {
      method: "POST",
      headers: { referer: "https://example.com/some/page" }
    });

    const result = validateOrigin(request);
    expect(result.valid).toBe(true);
    expect(result.origin).toBe("https://example.com");
  });

  it("allows requests without origin when valid write token provided", () => {
    const request = new Request("http://localhost/api/marketplace", {
      method: "POST",
      headers: { "x-marketplace-write-token": "test-token" }
    });

    const result = validateOrigin(request);
    expect(result.valid).toBe(true);
    expect(result.origin).toBe(null);
  });
});
