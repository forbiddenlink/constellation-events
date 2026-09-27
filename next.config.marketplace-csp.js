// Marketplace listing images can be served from the configured R2/CDN public
// base (see src/lib/marketplace-images.ts). Without this, uploaded listing
// images render broken in the browser because the CSP img-src directive
// silently blocks them — the domain allowlist for uploads and the CSP
// allowlist for rendering must agree.
//
// Split out of next.config.js (which Node loads directly, not through the
// TypeScript/Vitest pipeline) so this parsing logic has a real unit test
// instead of only being exercised indirectly through a build.
function getMarketplaceImageCspHost(base) {
  if (!base) return "";
  try {
    const url = new URL(base);
    // Hardcoding "https://" + hostname silently dropped a non-default port
    // (e.g. a base with :8443), producing a CSP entry that doesn't match
    // where images are actually served. It also let a non-http(s) scheme
    // (e.g. "javascript:") through: URL.origin for an opaque-origin scheme
    // is the literal string "null", which got appended into img-src as-is.
    // url.origin carries the real protocol, host, and port together, and
    // we skip the entry entirely for anything that isn't http(s).
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return ` ${url.origin}`;
  } catch {
    return "";
  }
}

module.exports = { getMarketplaceImageCspHost };
