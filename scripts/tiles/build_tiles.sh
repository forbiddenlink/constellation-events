#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_common.sh"
load_env

require_cmd find gdal_translate gdal2tiles.py

IN_PATH="${1:-$ROOT_DIR/data/cogs/lightpollution_latest.tif}"
OUT_DIR="${2:-$ROOT_DIR/data/tiles}"
ZOOM_RANGE="${ZOOM_RANGE:-${TILE_ZOOM_RANGE:-0-7}}"
TILE_FORMAT="${TILE_FORMAT:-PNG}"
PREFIX="${R2_TILE_PREFIX:-lightpollution}"
PROCESSES="${TILE_PROCESSES:-2}"

if [[ -d "$IN_PATH" ]]; then
  latest="$(find "$IN_PATH" -type f -name 'lightpollution_*.tif' | sort | tail -n 1)"
  if [[ -z "$latest" ]]; then
    echo "No COG files found in $IN_PATH" >&2
    exit 1
  fi
  INPUT_COG="$latest"
else
  INPUT_COG="$IN_PATH"
fi

if [[ ! -f "$INPUT_COG" ]]; then
  echo "Missing input COG: $INPUT_COG" >&2
  exit 1
fi

target_dir="$OUT_DIR/$PREFIX"
mkdir -p "$target_dir"

# gdal2tiles expects Byte/UInt16-like input; create a temporary Byte VRT view.
tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/constellation-tiles.XXXXXX")"
trap 'rm -rf "$tmp_dir"' EXIT
byte_vrt="$tmp_dir/byte.vrt"
gdal_translate -of VRT -ot Byte -scale "$INPUT_COG" "$byte_vrt"

# Build web mercator raster tiles for map overlay use.
gdal2tiles.py \
  --zoom="$ZOOM_RANGE" \
  --processes="$PROCESSES" \
  --tiledriver="$TILE_FORMAT" \
  --webviewer=none \
  "$byte_vrt" "$target_dir"

echo "Built tiles: $target_dir"
echo "Template: $target_dir/{z}/{x}/{y}.png"
