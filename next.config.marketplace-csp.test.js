import { describe, expect, it } from "vitest";
import { getMarketplaceImageCspHost } from "./next.config.marketplace-csp.js";

describe("getMarketplaceImageCspHost", () => {
  it("returns nothing when no base is configured", () => {
    expect(getMarketplaceImageCspHost(undefined)).toBe("");
    expect(getMarketplaceImageCspHost("")).toBe("");
  });

  it("returns the origin for a clean URL", () => {
    expect(getMarketplaceImageCspHost("https://pub-xxxx.r2.dev")).toBe(
      " https://pub-xxxx.r2.dev"
    );
  });

  it("drops the path but keeps the origin for a URL with a path", () => {
    expect(getMarketplaceImageCspHost("https://pub-xxxx.r2.dev/marketplace/images")).toBe(
      " https://pub-xxxx.r2.dev"
    );
  });

  it("keeps a non-default port instead of silently dropping it", () => {
    // Regression: the previous implementation built the entry from
    // `https://${url.hostname}`, which discarded the port entirely.
    expect(getMarketplaceImageCspHost("https://cdn.example.com:8443/path")).toBe(
      " https://cdn.example.com:8443"
    );
  });

  it("returns nothing for a bare host with no scheme (fails to parse)", () => {
    expect(getMarketplaceImageCspHost("pub-xxxx.r2.dev")).toBe("");
  });

  it("returns nothing for garbage input", () => {
    expect(getMarketplaceImageCspHost("not a url at all")).toBe("");
  });

  it("returns nothing for a non-http(s) scheme instead of injecting a literal 'null' origin", () => {
    // Regression: URL.origin for an opaque-origin scheme like javascript:
    // is the literal string "null", which would have been appended into
    // the CSP img-src directive as-is.
    expect(getMarketplaceImageCspHost("javascript:alert(1)")).toBe("");
    expect(getMarketplaceImageCspHost("ftp://cdn.example.com")).toBe("");
  });
});
