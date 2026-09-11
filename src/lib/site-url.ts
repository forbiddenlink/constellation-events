/**
 * Resolves the canonical production URL used for metadata (metadataBase,
 * canonical) and the sitemap. Order: explicit NEXT_PUBLIC_SITE_URL (set in
 * Vercel), then Vercel's own production-domain system env, then the known
 * production URL as a last-resort literal. Never falls back to localhost
 * or another product's domain.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "https://constellation-events.vercel.app";
}
