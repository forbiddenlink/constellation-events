import { afterEach, describe, expect, it } from "vitest";
import { getMarketplaceWriteAuth, isMarketplaceWriteProtected } from "./marketplace-auth";

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
});
