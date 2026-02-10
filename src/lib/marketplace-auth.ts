const WRITE_TOKEN_HEADER = "x-marketplace-write-token";

type WriteAuthResult = {
  allowed: boolean;
  writeProtected: boolean;
};

function getConfiguredToken() {
  return process.env.MARKETPLACE_WRITE_TOKEN?.trim() || "";
}

export function getMarketplaceWriteAuth(request: Request): WriteAuthResult {
  const configuredToken = getConfiguredToken();
  if (!configuredToken) {
    return { allowed: true, writeProtected: false };
  }

  const providedToken = request.headers.get(WRITE_TOKEN_HEADER)?.trim() || "";
  return {
    allowed: providedToken.length > 0 && providedToken === configuredToken,
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
    return sourceUrl === allowed || sourceUrl.endsWith(`.${new URL(allowed).hostname}`);
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
