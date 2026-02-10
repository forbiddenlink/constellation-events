# Light-Pollution Tile Pipeline (Constellation)

This pipeline builds and publishes our own light-pollution tile set.

## Required tools

- `curl`
- `gdal` (`gdalbuildvrt`, `gdalwarp`, `gdal_translate`, `gdal2tiles.py`)
- `aws` CLI (for R2 S3-compatible upload)

## Required environment

Set these in `.env.local` (or export in shell):

```env
EARTHDATA_USERNAME=...
LAADS_DOWNLOAD_TOKEN=...
# EARTHDATA_TOKEN=legacy_fallback
VIIRS_COLLECTION_ID=C3363944097-LANCEMODIS
# Optional override for reruns:
# VIIRS_TARGET_DATE=2026-02-06
# Optional for test runs:
# VIIRS_MAX_FILES=10

R2_BUCKET=constellation-tiles
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_PUBLIC_BASE=https://<public-r2-url>

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
```

## Input URL manifest

The pipeline can auto-generate `scripts/tiles/viirs_urls.txt` from NASA CMR.
Manual URL files are still supported.

Manual start from template:

```bash
cp scripts/tiles/viirs_urls.example.txt scripts/tiles/viirs_urls.txt
```

## One-command run

```bash
./scripts/tiles/check_setup.sh
./scripts/tiles/check_download_auth.sh
./scripts/tiles/run_pipeline.sh
```

This performs:

1. Generate daily VIIRS URL manifest from CMR
2. Download source files to `data/viirs`
3. Convert `.h5` subdatasets to GeoTIFF when needed
4. Merge + reproject + COG to `data/cogs/lightpollution_latest.tif`
5. Build `{z}/{x}/{y}.png` tiles in `data/tiles/lightpollution`
6. Upload tiles to R2 at `s3://$R2_BUCKET/lightpollution/`
7. Update `NEXT_PUBLIC_LIGHTPOLLUTION_TILES` in `.env.local`

## Daily scheduler run

```bash
./scripts/tiles/run_daily_update.sh
```

## macOS launchd install (recommended)

```bash
./scripts/tiles/install_launchd.sh
```

Remove it with:

```bash
./scripts/tiles/uninstall_launchd.sh
```

## Cron example (daily at 03:15 UTC)

```cron
15 3 * * * cd /Volumes/LizsDisk/constellation-events && ./scripts/tiles/run_daily_update.sh
```

## Troubleshooting

- `Missing command`: install dependencies (`brew install gdal awscli` on macOS)
- `Missing URL manifest`: add `scripts/tiles/viirs_urls.txt`
- No CMR results: set `VIIRS_TARGET_DATE=YYYY-MM-DD` and rerun
- `403/401 download`: generate a LAADS Download Token and set `LAADS_DOWNLOAD_TOKEN`
- No overlay in app: verify `NEXT_PUBLIC_LIGHTPOLLUTION_TILES` points to `.../lightpollution/{z}/{x}/{y}.png`
