import { vi } from "vitest";

/**
 * Mocks the better-auth session lookup used by
 * `getMarketplaceSessionUser` (src/lib/marketplace-authz.ts), so marketplace
 * route tests can exercise owner/non-owner/anonymous/admin flows without a
 * real Postgres connection. Call BEFORE dynamically importing the route
 * under test, after `vi.resetModules()`.
 *
 * Pass `null` for an anonymous (no session) request.
 */
export function mockMarketplaceSession(user: { id: string } | null) {
  vi.doMock("@/lib/auth", () => ({
    auth: {
      api: {
        getSession: vi.fn().mockResolvedValue(user ? { user, session: {} } : null)
      }
    }
  }));
}
