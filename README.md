# Constellation

> A stargazing hub: real-time astronomy event tracking, dark-sky location finder, satellite pass predictor, and a curated gear marketplace.

[![Live Demo](https://img.shields.io/badge/Live_Demo-000?style=for-the-badge&logo=vercel&logoColor=white)](https://constellation-events.vercel.app)
![Next.js](https://img.shields.io/badge/Next.js-000?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

## What it does

Constellation is a Next.js app that pulls together real astronomical data sources (JPL Horizons, astronomy-engine, NOAA SWPC, NASA APOD, Celestrak TLEs) into a single place for planning a night of stargazing: what's visible tonight, where to go for darker skies, when the ISS or other satellites will pass overhead, and where to buy or sell gear.

See `API.md` for the full API reference and `CLAUDE.md` for architecture notes.

## Features

- **Tonight's Sky** - real-time celestial highlights (moon, visible planets) sourced from JPL Horizons, with a local astronomy-engine fallback
- **Astronomy Events** - upcoming meteor showers, moon phases, planetary conjunctions/oppositions, and eclipses with per-location visibility scoring; events export to iCal
- **Tonight's Observation Planner** - optimal viewing window, moon phase/illumination, sunset/sunrise/twilight times, visible planets, active meteor showers, and prioritized recommendations
- **Dark-Sky Location Finder** - nearby dark-sky sites scored on the Bortle scale, with distance, elevation, amenities, and a Mapbox map with a light-pollution tile overlay (VIIRS data)
- **ISS & Satellite Pass Tracking** - live ISS position and upcoming visible satellite passes, computed with satellite.js from Celestrak TLE data
- **Aurora Forecast** - aurora visibility forecast from NOAA SWPC
- **Weather & Sky Quality** - cloud cover, seeing, transparency, and an overall sky-quality score per location
- **NASA Picture of the Day** - daily APOD image and description
- **Gear Marketplace** - browse and list telescopes, mounts, cameras, eyepieces, and filters, with image uploads to S3/R2-compatible storage and account auth via Better Auth
- **Light-pollution tile pipeline** - shell scripts in `scripts/tiles/` (GDAL and the AWS CLI) build VIIRS-based map tiles and upload them to Cloudflare R2. You run them by hand; see `scripts/tiles/README.md`.

## Getting started

```bash
git clone https://github.com/forbiddenlink/constellation-events
cd constellation-events
pnpm install
cp .env.example .env.local  # fill in NEXT_PUBLIC_MAPBOX_TOKEN at minimum for the map
pnpm dev
```

`.env.example` documents every variable. The map (`NEXT_PUBLIC_MAPBOX_TOKEN`) and NASA APOD key are the main ones to set for local dev; weather provider keys, R2 tile hosting, Earthdata/VIIRS credentials, Axiom logging, and Trigger.dev are optional and each degrade gracefully when unset.

### Prerequisites

Node.js (`.nvmrc` pins 24) and pnpm (`pnpm@10.34.9` in `packageManager`).

### Testing

```bash
pnpm test          # Vitest unit tests
pnpm test:e2e       # Playwright end-to-end tests
```

### Linting and formatting

```bash
pnpm lint          # ESLint
pnpm biome:check   # Biome
pnpm type-check    # tsc --noEmit
```

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS
- **Astronomy:** astronomy-engine, JPL Horizons, satellite.js, Celestrak TLE data
- **Maps:** Mapbox GL
- **Auth:** Better Auth
- **Storage:** AWS S3 SDK (Cloudflare R2-compatible) for marketplace images and map tiles
- **Background jobs:** Trigger.dev is configured (`trigger.config.ts`), but the two tasks in `src/trigger/ingest-events.ts` are placeholders with TODO bodies
- **Calendar export:** ical-generator
- **Observability:** Sentry, Axiom, Vercel Analytics/Speed Insights
- **Testing:** Vitest, Playwright, Testing Library
- **Deployment:** Vercel

## License

MIT
