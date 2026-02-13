import { afterEach, describe, expect, it } from "vitest";
import { checkRateLimit, getClientIp, __resetRateLimitForTests } from "./rate-limit";

describe("rate limiting", () => {
  afterEach(() => {
    __resetRateLimitForTests();
  });

  it("allows requests within limit", () => {
    const result1 = checkRateLimit("test-key", { limit: 3, windowMs: 60000 });
    const result2 = checkRateLimit("test-key", { limit: 3, windowMs: 60000 });
    const result3 = checkRateLimit("test-key", { limit: 3, windowMs: 60000 });

    expect(result1.allowed).toBe(true);
    expect(result1.remaining).toBe(2);
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(1);
    expect(result3.allowed).toBe(true);
    expect(result3.remaining).toBe(0);
  });

  it("blocks requests exceeding limit", () => {
    checkRateLimit("test-key", { limit: 2, windowMs: 60000 });
    checkRateLimit("test-key", { limit: 2, windowMs: 60000 });
    const blocked = checkRateLimit("test-key", { limit: 2, windowMs: 60000 });

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("isolates rate limits by key", () => {
    checkRateLimit("key-a", { limit: 1, windowMs: 60000 });
    const blockedA = checkRateLimit("key-a", { limit: 1, windowMs: 60000 });
    const allowedB = checkRateLimit("key-b", { limit: 1, windowMs: 60000 });

    expect(blockedA.allowed).toBe(false);
    expect(allowedB.allowed).toBe(true);
  });
});

describe("client IP extraction", () => {
  it("prefers x-real-ip header", () => {
    const request = new Request("http://localhost/api/test", {
      headers: {
        "x-real-ip": "1.2.3.4",
        "x-forwarded-for": "5.6.7.8, 9.10.11.12"
      }
    });

    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("uses rightmost IP from x-forwarded-for (not leftmost)", () => {
    // Leftmost can be spoofed by client, rightmost is added by first trusted proxy
    const request = new Request("http://localhost/api/test", {
      headers: {
        "x-forwarded-for": "spoofed-ip, real-proxy-ip"
      }
    });

    expect(getClientIp(request)).toBe("real-proxy-ip");
  });

  it("handles single IP in x-forwarded-for", () => {
    const request = new Request("http://localhost/api/test", {
      headers: {
        "x-forwarded-for": "single-ip"
      }
    });

    expect(getClientIp(request)).toBe("single-ip");
  });

  it("trims whitespace from IPs", () => {
    const request = new Request("http://localhost/api/test", {
      headers: {
        "x-forwarded-for": "  1.2.3.4  ,  5.6.7.8  "
      }
    });

    expect(getClientIp(request)).toBe("5.6.7.8");
  });

  it("returns unknown when no IP headers present", () => {
    const request = new Request("http://localhost/api/test");
    expect(getClientIp(request)).toBe("unknown");
  });
});
