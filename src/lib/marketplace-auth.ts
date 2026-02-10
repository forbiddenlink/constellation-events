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
