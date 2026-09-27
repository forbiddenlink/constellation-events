const { withSentryConfig } = require("@sentry/nextjs");
/** @type {import('next').NextConfig} */
const { withAxiom } = require('next-axiom');
const withBundleAnalyzer = require("@next/bundle-analyzer")({ enabled: process.env.ANALYZE === "true" });

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org"
      }
    ]
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)"
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload"
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              // 'unsafe-inline' is required for App Router hydration: Next.js
              // emits inline bootstrap/hydration scripts, and a per-request
              // nonce cannot be used here because the pages are statically
              // prerendered (build-time HTML has no runtime nonce). Without
              // this, the site stays stuck on "Loading...".
              "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://vitals.vercel-insights.com; " +
              "style-src 'self' 'unsafe-inline'; " +
              `img-src 'self' data: blob: https://images.unsplash.com https://upload.wikimedia.org https://grainy-gradients.vercel.app https://apod.nasa.gov${marketplaceImageCspHost}; ` +
              "font-src 'self' https://fonts.gstatic.com; " +
              "connect-src 'self' https://api.open-meteo.com https://api.n2yo.com https://api.nasa.gov https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io; " +
              "frame-src 'self' https://www.youtube.com https://youtube.com https://player.vimeo.com; " +
              "frame-ancestors 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self'"
          }
        ]
      }
    ];
  }
};

// Marketplace listing images can be served from the configured R2/CDN public
// base (see src/lib/marketplace-images.ts). Without this, uploaded listing
// images render broken in the browser because the CSP img-src directive
// silently blocks them — the domain allowlist for uploads and the CSP
// allowlist for rendering must agree.
function getMarketplaceImageCspHost() {
  const base = process.env.MARKETPLACE_IMAGE_PUBLIC_BASE || process.env.R2_PUBLIC_BASE;
  if (!base) return "";
  try {
    return ` https://${new URL(base).hostname}`;
  } catch {
    return "";
  }
}

const marketplaceImageCspHost = getMarketplaceImageCspHost();

module.exports = withBundleAnalyzer(withSentryConfig(withAxiom(nextConfig), {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: !process.env.CI,
    widenClientFileUpload: true,
    disableLogger: true,
    automaticVercelMonitors: true,
  }));