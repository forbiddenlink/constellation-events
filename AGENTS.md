# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Constellation is a cinematic astronomy event tracker and stargazing hub built with Next.js 14 (App Router). It combines real-time celestial data (JPL Horizons, astronomy-engine), weather conditions, dark-sky location scouting, an ISS pass predictor, aurora forecasts, and a curated gear marketplace with R2-backed image uploads.

## Commands

### Development
```
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build (also runs lint + typecheck)
npm run start        # Serve production build
```

### Testing
```
npm test             # Run all vitest unit tests (47 tests across 9 files)
npx vitest run src/lib/rate-limit.test.ts   # Run a single test file
npx vitest -t "allows requests within limit"  # Run a single test by name
npm run test:e2e     # Playwright E2E tests (needs dev server or will start one)
npm run test:e2e:ui  # Playwright interactive UI mode
```

### Linting & Type Checking
```
npm run lint         # ESLint (next/core-web-vitals config)
npx tsc --noEmit     # TypeScript type check
```

### CI
GitHub Actions (`.github/workflows/ci.yml`) runs lint → test → build → typecheck → e2e on push/PR to `main`.

## Architecture

### Data Flow
The app follows a three-tier pattern: **Client components → Next.js API routes → External APIs/local data**.

Client components (`"use client"`) fetch from internal `/api/*` routes. API routes handle rate limiting, coordinate parsing, caching, and call external services (JPL Horizons, Open-Meteo, NOAA SWPC, NASA APOD, N2YO, OpenWeather). When external APIs fail, every route has a graceful fallback (estimated values, mock data, or astronomy-engine client-side calculations).

### Celestial Calculations
Two calculation paths exist:
1. **JPL Horizons** (`src/lib/horizons.ts`) — Server-side HTTP calls to NASA's ephemeris service for precise planet positions. Used as primary source in `/api/sky/tonight` and `/api/planner/tonight`.
2. **astronomy-engine** (`src/lib/celestial-engine.ts`) — Local ephemeris library used as fallback when Horizons is unavailable and for moon phase/sun times calculations. Provides `getVisiblePlanets`, `getMoonInfo`, `getSunTimes`, `getMoonTimes`, `getOptimalObservationWindow`.

The `src/lib/astronomy.ts` module is the public API that wraps celestial-engine with higher-level functions (`calculateMoonPhase`, `calculateSunMoonTimes`, `calculateVisibilityScore`, `calculateOptimalWindow`).

### Marketplace System
- **Types & filtering**: `src/lib/marketplace.ts` — Pure functions, shared between client and server
- **Persistence**: `src/lib/marketplace-store.ts` — JSON file store at `data/marketplace/listings.json`, in-memory cache with serialized write queue
- **Auth**: `src/lib/marketplace-auth.ts` — Timing-safe token comparison via `x-marketplace-write-token` header, CSRF origin validation
- **Images**: `src/lib/marketplace-images.ts` + `upload-url/route.ts` — Presigned R2 upload URLs, browser-side image optimization (resize + WebP conversion)
- **Write endpoints** (`POST /api/marketplace`, `PATCH /api/marketplace/[id]`) enforce auth → origin → rate limit → validation → persist

### Shared Infrastructure
- **Rate limiting**: `src/lib/rate-limit.ts` — In-memory sliding window per client IP. Two presets: `externalApi` (60/min) and `write` (10/min). Test helper: `__resetRateLimitForTests()`.
- **Caching**: `src/lib/cache.ts` — In-memory LRU cache (max 1000 entries) with TTL expiration. Used by Horizons and planner routes.
- **API responses**: `src/lib/api-response.ts` — Standardized error response builder (`errors.badRequest()`, `errors.rateLimited()`, etc.)
- **Geo**: `src/lib/geo.ts` — `Coordinates` type, `parseCoordinates` with lat/lng validation, `clamp` utility
- **Config**: `src/lib/config.ts` — Centralized env var access with validation and startup logging

### Client-Side Patterns
- **Geolocation**: `src/hooks/useGeolocation.ts` — Singleton pattern with shared state across components to avoid duplicate permission prompts
- **Night vision**: `src/hooks/useNightMode.ts` — Toggles `.night-vision` CSS class on `<html>` for red-shifted field mode, persisted in localStorage
- **Error boundary**: `src/components/ClientErrorBoundary.tsx` wraps all page content

### Styling
- Tailwind CSS with a space-themed design system defined in `tailwind.config.ts`
- Custom color tokens: `midnight`, `deep-space`, `nebula`, `starlight`, `aurora`, `comet`, `ember`, `void`
- Three font families: `--font-sans` (Space Grotesk), `--font-display` (DM Serif Display), `--font-mono` (JetBrains Mono)
- Glass morphism utilities (`.glass`, `.glass-panel`) and night-vision mode in `globals.css`
- HUD-style monospace aesthetic in the marketplace ("Deep Space Manifest" UI)

### External Services & API Keys
- **Mapbox** (`NEXT_PUBLIC_MAPBOX_TOKEN`) — Dark-sky map with light pollution tile overlay
- **Light pollution tiles** (`NEXT_PUBLIC_LIGHTPOLLUTION_TILES`) — Custom NASA VIIRS tiles hosted on Cloudflare R2
- **OpenWeather** (`OPENWEATHER_API_KEY`) — Optional; falls back to Open-Meteo (free, no key)
- **NASA** (`NASA_API_KEY`) — APOD; `DEMO_KEY` works with lower rate limits
- **Cloudflare R2** (`R2_BUCKET`, `R2_ENDPOINT`, etc.) — Tile hosting + marketplace image uploads
- **NOAA SWPC** — Aurora Kp index (no key required)
- **N2YO** (`N2YO_API_KEY`) — Optional ISS pass predictions; falls back to open-notify

### Key Conventions
- Path alias `@/*` maps to `./src/*`
- All API routes use `parseCoordinates` for lat/lng with fallback to `config.defaultLocation` (Las Vegas)
- Test files live alongside source: `foo.ts` → `foo.test.ts`
- E2E tests are in `e2e/` using Playwright (Chromium only)
- Marketplace store test helpers are exported with `__` prefix (e.g. `__resetMarketplaceStoreForTests`)
- The `data/marketplace/` directory holds persistent marketplace state (auto-seeded from defaults on first run)

### Security Headers
Configured in both `next.config.js` (CSP, X-Frame-Options, etc.) and `vercel.json`. The CSP allows `self`, Vercel analytics, Mapbox, Open-Meteo, NASA, and specific image hosts.

### Deployment
Deployed on Vercel. The `vercel.json` adds security headers. The tile pipeline (`scripts/tiles/`) generates light pollution map tiles from NASA VIIRS data and uploads to R2.
