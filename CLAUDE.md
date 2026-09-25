# constellation-events

Cinematic astronomy event tracker and stargazing hub, built with Next.js
(App Router). Combines real-time celestial data (JPL Horizons,
astronomy-engine), weather conditions, dark-sky location scouting, an ISS
pass predictor, aurora forecasts, and a curated gear marketplace with
R2-backed image uploads.

## Stack

- Next.js ^16.3.4 (App Router), TypeScript, Tailwind CSS 4
- pnpm (`packageManager: pnpm@10.34.5`)
- better-auth, pg + better-sqlite3, Cloudflare R2 (`@aws-sdk/client-s3`)
- Trigger.dev, Sentry, Axiom, Arcjet
- Vitest (unit) + Playwright (e2e, Chromium only)
- ESLint (`next/core-web-vitals`) and Biome are both configured; `pnpm lint`
  runs ESLint only

## Commands

- `pnpm dev` - dev server at localhost:3000
- `pnpm build` - production build; Next.js runs ESLint and the TypeScript
  check as part of the build (no `ignoreDuringBuilds`/`ignoreBuildErrors`
  override in `next.config.js`)
- `pnpm lint` - `eslint src`
- `pnpm type-check` - `tsc --noEmit`
- `pnpm test` / `pnpm test:watch` / `pnpm test:coverage` - Vitest
- `pnpm test:e2e` / `pnpm test:e2e:ui` - Playwright (starts a dev server if
  one isn't already running)
- `pnpm biome:check` / `pnpm biome:fix` / `pnpm biome:format`
- CI (`.github/workflows/ci.yml`): lint, test, typecheck run in parallel,
  then build, then e2e

## Architecture

- Three-tier: client components (`"use client"`) fetch internal `/api/*`
  routes, which rate-limit, parse coordinates, cache, and call external
  services (JPL Horizons, Open-Meteo, NOAA SWPC, NASA APOD, N2YO,
  OpenWeather), each with a graceful fallback.
- Celestial calculations: `src/lib/horizons.ts` (server-side JPL Horizons
  calls, primary source for `/api/sky/tonight` and `/api/planner/tonight`)
  and `src/lib/celestial-engine.ts` (local `astronomy-engine` fallback, also
  used for moon phase/sun times). `src/lib/astronomy.ts` is the public
  wrapper (`calculateMoonPhase`, `calculateSunMoonTimes`,
  `calculateVisibilityScore`, `calculateOptimalWindow`).
- Marketplace: `src/lib/marketplace.ts` (pure types/filtering),
  `src/lib/marketplace-store.ts` (JSON file store at
  `data/marketplace/listings.json`, serialized write queue),
  `src/lib/marketplace-auth.ts` (timing-safe `x-marketplace-write-token`
  check + CSRF origin validation), `src/lib/marketplace-images.ts` and the
  marketplace upload-url route (presigned R2 uploads, browser-side
  resize/WebP).
- Shared: `src/lib/rate-limit.ts` (in-memory sliding window; `externalApi`
  60/min, `write` 10/min; `__resetRateLimitForTests()`), `src/lib/cache.ts`
  (in-memory LRU, max 1000, TTL), `src/lib/api-response.ts` (standardized
  error builders), `src/lib/geo.ts` (`parseCoordinates`, `clamp`),
  `src/lib/config.ts` (env access + startup validation logging).
- `src/hooks/useGeolocation.ts` is a singleton shared across components to
  avoid duplicate permission prompts. `src/hooks/useNightMode.ts` toggles a
  `.night-vision` class, persisted in localStorage.
- Path alias `@/*` -> `./src/*`. Test files live alongside source
  (`foo.ts` -> `foo.test.ts`); e2e tests are in `e2e/`.
- Security headers are set in both `next.config.js` and `vercel.json`.
- `scripts/tiles/` generates light-pollution map tiles from NASA VIIRS data
  and uploads them to R2.

## Env vars

Validated in `src/env.ts`; full list with descriptions is in `.env.example`.
Key ones: `NEXT_PUBLIC_MAPBOX_TOKEN` (map), `NEXT_PUBLIC_LIGHTPOLLUTION_TILES`
(R2-hosted tile overlay), `OPENWEATHER_API_KEY` (optional per
`src/lib/config.ts`, falls back to Open-Meteo), `NASA_API_KEY` (`DEMO_KEY`
works with lower limits), `R2_*` (bucket/tile hosting + marketplace images),
`TRIGGER_*`, `RESEND_API_KEY`, `AXIOM_TOKEN`, `NEXT_PUBLIC_POSTHOG_*`.
`MARKETPLACE_*` vars (write token, rate limits, image limits) are optional
overrides, default is `data/marketplace`.

## Gotchas

- `src/env.ts` marks `OPENWEATHER_API_KEY`, `EARTHDATA_TOKEN`, and
  `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY` as required (`min(1)`, not
  `.optional()`), but `src/lib/config.ts` and `.env.example` treat them as
  optional with runtime fallbacks. Without `SKIP_ENV_VALIDATION` set, a
  missing one of these fails env validation even though the feature that
  needs it degrades gracefully at runtime.
- `MINIMAX_API_KEY` is required in `src/env.ts` but not read anywhere else
  in `src/` or `scripts/`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
