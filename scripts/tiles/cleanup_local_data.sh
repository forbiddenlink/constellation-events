#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_common.sh"
load_env

DATA_DIR="${1:-$ROOT_DIR/data}"
RAW_DAYS="${RAW_RETENTION_DAYS:-3}"
COG_DAYS="${COG_RETENTION_DAYS:-14}"
LOG_DAYS="${LOG_RETENTION_DAYS:-30}"

mkdir -p "$DATA_DIR/viirs" "$DATA_DIR/cogs" "$DATA_DIR/logs"

# Keep latest rolling COG symlink/file intact.
latest_cog="$DATA_DIR/cogs/lightpollution_latest.tif"

echo "Cleaning raw downloads older than $RAW_DAYS days"
find "$DATA_DIR/viirs" -type f -mtime +"$RAW_DAYS" -delete

echo "Cleaning dated COG files older than $COG_DAYS days"
find "$DATA_DIR/cogs" -type f -name 'lightpollution_*.tif' -mtime +"$COG_DAYS" -delete

if [[ -f "$latest_cog" ]]; then
  touch "$latest_cog"
fi

echo "Cleaning logs older than $LOG_DAYS days"
find "$DATA_DIR/logs" -type f -name 'tile-update-*.log' -mtime +"$LOG_DAYS" -delete

echo "Cleanup complete"
