#!/usr/bin/env bash
set -euo pipefail

IN_DIR=${1:-./data/viirs}
OUT_DIR=${2:-./data/cogs}
mkdir -p "$OUT_DIR"

cat <<'MSG'
Processing steps to implement:
- Merge VIIRS rasters
- Reproject to Web Mercator (EPSG:3857)
- Normalize values to 0-255
- Export as Cloud Optimized GeoTIFF (COG)

Dependencies:
- gdal (gdalwarp, gdal_translate)
- python3 + rasterio (optional)
MSG
