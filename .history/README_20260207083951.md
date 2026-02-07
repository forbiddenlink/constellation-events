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
NEXT_PUBLIC_LIGHTPOLLUTION_TILES=your_raster_tile_url
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
| `GET /api/marketplace` | Gear listings | none |

## 🛰️ Light-Pollution Tile Pipeline

We generate custom light pollution tiles from NASA VIIRS Night-Time Lights data.

See detailed pipeline documentation in [`scripts/tiles/README.md`](scripts/tiles/README.md)

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
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

## 🌟 Acknowledgments

- NASA VIIRS for night-time light pollution data
- JPL Horizons for ephemeris calculations
- Mapbox for mapping infrastructure
