# Light-Pollution Tile Pipeline (Constellation)

This pipeline builds our own raster tiles from NASA VIIRS night-lights data and publishes them to Cloudflare R2.

## What You Need

- Earthdata login (free) to download VIIRS data.
- `gdal` + `python3` + `rio` (rasterio) installed.
- `aws` CLI configured for Cloudflare R2 (S3-compatible).

## Environment Variables

```
R2_BUCKET=constellation-tiles
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_PUBLIC_BASE=https://<custom-domain-or-public-endpoint>
```

## Recommended Workflow

1. Download the latest VIIRS NRT night-lights tiles.
2. Reproject and normalize into a global raster COG.
3. Generate tiles (MBTiles or ZXY raster).
4. Upload tiles to R2 and set `NEXT_PUBLIC_LIGHTPOLLUTION_TILES`.

## Command Summary

```bash
./scripts/tiles/fetch_viirs_nrt.sh ./data/viirs
./scripts/tiles/process_to_cog.sh ./data/viirs ./data/cogs
./scripts/tiles/build_tiles.sh ./data/cogs ./data/tiles
./scripts/tiles/upload_r2.sh ./data/tiles
```

## Notes

- Realtime updates are expensive. Expect 5-15 GB per run for global coverage.
- We can move to a weekly or monthly cadence once we stabilize the pipeline.
