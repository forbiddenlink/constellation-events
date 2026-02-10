# 🌌 Constellation — Astronomy Event Tracker

A cinematic, data-driven stargazing hub with event planning, dark-sky scouting, and a curated gear marketplace.

## ✨ Features

- **Live Sky Status** - Real-time visibility conditions and celestial events
- **Event Planning** - Track meteor showers, eclipses, planetary alignments
- **Dark-Sky Locations** - Find optimal stargazing spots based on light pollution data
- **Interactive Star Maps** - Visualize constellations and celestial objects
- **Marketplace** - Curated astronomy gear and equipment
- **Custom Light Pollution Tiles** - NASA VIIRS data hosted on Cloudflare R2

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone git@github.com:forbiddenlink/constellation-events.git
cd constellation-events

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🔧 Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
NEXT_PUBLIC_LIGHTPOLLUTION_TILES=https://pub-...r2.dev/lightpollution/{z}/{x}/{y}.png

WEATHER_API_PROVIDER=auto
OPENWEATHER_API_KEY=your_openweather_api_key_optional

R2_BUCKET=constellation-tiles
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_PUBLIC_BASE=https://pub-...r2.dev
R2_TILE_PREFIX=lightpollution
TILE_UPDATE_CADENCE=daily
TILE_ZOOM_RANGE=0-7
TILE_PROCESSES=2
ENABLE_LOCAL_CLEANUP=true
RAW_RETENTION_DAYS=3
COG_RETENTION_DAYS=14
LOG_RETENTION_DAYS=30
TILE_RUN_HOUR=3
TILE_RUN_MINUTE=15

EARTHDATA_USERNAME=your_earthdata_username
LAADS_DOWNLOAD_TOKEN=your_lads_download_token

# Optional marketplace write protection
MARKETPLACE_WRITE_TOKEN=change-me
MARKETPLACE_WRITE_RATE_LIMIT_MAX=10
MARKETPLACE_WRITE_RATE_LIMIT_WINDOW_MS=60000
MARKETPLACE_IMAGE_PREFIX=marketplace/images
MARKETPLACE_IMAGE_MAX_BYTES=5242880
# Optional override if listing images use a different public base:
# MARKETPLACE_IMAGE_PUBLIC_BASE=https://pub-...r2.dev
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Mapbox GL
- **Data Sources**: JPL Horizons API, NASA VIIRS

## 📡 API Routes

| Endpoint | Description | Parameters |
|----------|-------------|------------|
| `GET /api/sky/tonight` | Current night sky data | none |
| `GET /api/events` | Astronomy events | `lat`, `lng`, `from`, `to` |
| `GET /api/locations` | Dark-sky locations | `lat`, `lng` |
| `GET /api/marketplace` | Gear listings | `q`, `category`, `condition`, `maxPrice`, `sort`, `scope` |
| `POST /api/marketplace` | Create listing | `title`, `tag`, `category`, `condition`, `priceUsd`, `city`, `shipping`, optional `description`, `imageUrl` |
| `PATCH /api/marketplace/:id` | Update listing | Any of create fields + optional `status` |
| `POST /api/marketplace/upload-url` | Generate signed R2 image upload URL | `filename`, `contentType`, `size` |

When `MARKETPLACE_WRITE_TOKEN` is set, `POST` and `PATCH` require header `x-marketplace-write-token: <token>`.
Public marketplace queries return only `approved` listings. Use `scope=all` with valid write token to include `pending` and `hidden`.
Write endpoints are rate-limited per client IP (`MARKETPLACE_WRITE_RATE_LIMIT_MAX` per `MARKETPLACE_WRITE_RATE_LIMIT_WINDOW_MS`).
Direct marketplace image uploads require an R2 bucket CORS rule that allows browser `PUT` from your app origin.
Marketplace image files are resized/compressed in-browser before upload to keep costs down.

## 🛰️ Light-Pollution Tile Pipeline

We generate custom light pollution tiles from NASA VIIRS Night-Time Lights data.

See detailed pipeline documentation in [`scripts/tiles/README.md`](scripts/tiles/README.md)

Quick run:

```bash
./scripts/tiles/check_setup.sh
./scripts/tiles/check_download_auth.sh
./scripts/tiles/run_pipeline.sh
```

Install daily macOS scheduler:

```bash
./scripts/tiles/install_launchd.sh
```

## 🗺️ Roadmap

- [x] Core event tracking and location finder
- [x] Live sky status with JPL Horizons integration
- [x] Light-pollution tile pipeline
- [ ] Refined visibility scoring algorithm
- [ ] AR constellation viewer (Phase 2)
- [ ] User accounts and saved locations
- [ ] Push notifications for upcoming events
- [ ] Mobile app (React Native)

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run automated tests
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

## 🌟 Acknowledgments

- NASA VIIRS for night-time light pollution data
- JPL Horizons for ephemeris calculations
- Mapbox for mapping infrastructure
