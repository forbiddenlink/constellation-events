import { timingSafeEqual } from "node:crypto";

const WRITE_TOKEN_HEADER = "x-marketplace-write-token";

type WriteAuthResult = {
  allowed: boolean;
  writeProtected: boolean;
};

function getConfiguredToken() {
  return process.env.MARKETPLACE_WRITE_TOKEN?.trim() || "";
}

/**
 * Timing-safe token comparison to prevent timing attacks.
 * Compares tokens in constant time regardless of where they differ.
 */
function tokensMatch(provided: string, configured: string): boolean {
  if (provided.length === 0 || configured.length === 0) {
    return false;
  }
  // Pad to same length to prevent length-based timing leaks
  const maxLen = Math.max(provided.length, configured.length);
  const providedBuf = Buffer.alloc(maxLen);
  const configuredBuf = Buffer.alloc(maxLen);
  providedBuf.write(provided);
  configuredBuf.write(configured);
  // timingSafeEqual requires equal length buffers
  return provided.length === configured.length && timingSafeEqual(providedBuf, configuredBuf);
}

export function getMarketplaceWriteAuth(request: Request): WriteAuthResult {
  const configuredToken = getConfiguredToken();
  if (!configuredToken) {
    return { allowed: true, writeProtected: false };
  }

  const providedToken = request.headers.get(WRITE_TOKEN_HEADER)?.trim() || "";
  return {
    allowed: tokensMatch(providedToken, configuredToken),
    writeProtected: true
  };
}

export function isMarketplaceWriteProtected() {
  return Boolean(getConfiguredToken());
}

export function getMarketplaceWriteTokenHeaderName() {
  return WRITE_TOKEN_HEADER;
}

/**
 * Validate Origin header for CSRF protection
 * Returns true if the origin is allowed, false otherwise
 */
export function validateOrigin(request: Request): { valid: boolean; origin: string | null } {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // If no origin header, check referer as fallback
  const sourceUrl = origin || (referer ? new URL(referer).origin : null);

  if (!sourceUrl) {
    // No origin info - could be same-origin request or server-to-server
    // Allow if there's a valid write token (API client)
    const auth = getMarketplaceWriteAuth(request);
    return { valid: auth.allowed && auth.writeProtected, origin: null };
  }

  // Get allowed origins from environment or use defaults
  const allowedOrigins = getAllowedOrigins();

  // Check if origin matches any allowed origin
  const isAllowed = allowedOrigins.some((allowed) => {
    if (allowed === "*") return true;
    try {
      const allowedHost = new URL(allowed).hostname;
      const sourceHost = new URL(sourceUrl).hostname;
      // Exact match or subdomain match (e.g., api.example.com matches example.com)
      return sourceHost === allowedHost || sourceHost.endsWith(`.${allowedHost}`);
    } catch {
      return false;
    }
  });

  return { valid: isAllowed, origin: sourceUrl };
}

function getAllowedOrigins(): string[] {
  const configured = process.env.MARKETPLACE_ALLOWED_ORIGINS?.trim();
  if (configured) {
    return configured.split(",").map((o) => o.trim()).filter(Boolean);
  }

  // Default to same-origin only in production, allow localhost in development
  if (process.env.NODE_ENV === "production") {
    const vercelUrl = process.env.VERCEL_URL;
    return vercelUrl ? [`https://${vercelUrl}`] : [];
  }

  return ["http://localhost:3000", "http://127.0.0.1:3000"];
}
