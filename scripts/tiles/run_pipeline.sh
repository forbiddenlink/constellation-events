#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_common.sh"
load_env

BASE_DIR="${1:-$ROOT_DIR/data}"
VIIRS_DIR="$BASE_DIR/viirs"
COG_DIR="$BASE_DIR/cogs"
TILE_DIR="$BASE_DIR/tiles"
MANIFEST_FILE="${VIIRS_URLS_FILE:-$ROOT_DIR/scripts/tiles/viirs_urls.txt}"

"$SCRIPT_DIR/generate_viirs_manifest.sh" "$MANIFEST_FILE"
"$SCRIPT_DIR/fetch_viirs_nrt.sh" "$VIIRS_DIR" "$MANIFEST_FILE"
"$SCRIPT_DIR/process_to_cog.sh" "$VIIRS_DIR" "$COG_DIR"
"$SCRIPT_DIR/build_tiles.sh" "$COG_DIR/lightpollution_latest.tif" "$TILE_DIR"
UPDATE_ENV_LOCAL=true "$SCRIPT_DIR/upload_r2.sh" "$TILE_DIR/${R2_TILE_PREFIX:-lightpollution}"

echo "Pipeline complete"
