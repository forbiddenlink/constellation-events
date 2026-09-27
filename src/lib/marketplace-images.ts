function normalizeUrlBase(value: string | undefined) {
  if (!value) return "";
  try {
    const url = new URL(value);
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

export function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getMarketplaceImagePublicBase() {
  return (
    normalizeUrlBase(process.env.MARKETPLACE_IMAGE_PUBLIC_BASE?.trim()) ||
    normalizeUrlBase(process.env.R2_PUBLIC_BASE?.trim())
  );
}

function allowExternalMarketplaceImageUrls() {
  return process.env.MARKETPLACE_IMAGE_ALLOW_EXTERNAL?.trim().toLowerCase() === "true";
}

export function isAllowedMarketplaceImageUrl(imageUrl: string) {
  if (allowExternalMarketplaceImageUrls()) return true;
  const publicBase = getMarketplaceImagePublicBase();
  // Deny by default when no public base is configured. Previously this
  // fail-opened (allowed ANY http/https URL) whenever image storage wasn't
  // set up, silently disabling the domain allowlist instead of denying —
  // the opt-in escape hatch is MARKETPLACE_IMAGE_ALLOW_EXTERNAL, not an
  // unconfigured public base.
  if (!publicBase) return false;
  return imageUrl.startsWith(`${publicBase}/`);
}
