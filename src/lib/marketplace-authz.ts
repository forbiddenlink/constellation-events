import type { MarketplaceListing } from "@/lib/marketplace";

export type MarketplaceSessionUser = {
  id: string;
};

/**
 * Resolves the authenticated better-auth session user for a marketplace
 * request, or null when there isn't one. Wrapped in try/catch: a session
 * lookup failure (unreachable DB, malformed cookie) must be treated as
 * "no session", never surfaced as a 500 or, worse, treated as authenticated.
 */
export async function getMarketplaceSessionUser(
  request: Request
): Promise<MarketplaceSessionUser | null> {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return null;
    return { id: session.user.id };
  } catch (error) {
    console.error("[marketplace-authz] Session lookup failed:", error);
    return null;
  }
}

/**
 * Admin identity for marketplace moderation, via an env allowlist of
 * better-auth user ids rather than the better-auth `admin` plugin. The admin
 * plugin needs its own schema migration and a change to src/lib/auth.ts
 * (auth provider config) - both are out of bounds for this change. Revisit
 * once Liz decides to adopt the plugin.
 */
export function isMarketplaceAdmin(userId: string): boolean {
  const allowlist = process.env.MARKETPLACE_ADMIN_USER_IDS?.trim();
  if (!allowlist) return false;
  return allowlist
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .includes(userId);
}

/**
 * Whether `userId` may edit/delete non-moderation fields on `listing`.
 * A listing with no sellerId (seed data, or anything created before
 * ownership existed) is legacy and editable only by an admin.
 */
export function canModifyListing(
  listing: Pick<MarketplaceListing, "sellerId">,
  userId: string,
  isAdmin: boolean
): boolean {
  if (isAdmin) return true;
  if (!listing.sellerId) return false;
  return listing.sellerId === userId;
}
