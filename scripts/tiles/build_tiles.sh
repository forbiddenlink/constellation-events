#!/usr/bin/env bash
set -euo pipefail

IN_DIR=${1:-./data/cogs}
OUT_DIR=${2:-./data/tiles}
mkdir -p "$OUT_DIR"

cat <<'MSG'
Tile build steps to implement:
- Generate raster tiles (ZXY) from COG
- Use gdal2tiles.py or rio-tiler
- Zoom levels: 0-8 for global NRT

Dependencies:
- gdal (gdal2tiles.py)
- python3 + rio-tiler (optional)
MSG
