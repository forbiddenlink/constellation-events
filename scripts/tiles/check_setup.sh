#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_common.sh"
load_env

require_cmd curl aws python3

missing=0
for cmd in gdalbuildvrt gdalwarp gdal_translate gdal2tiles.py; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing command: $cmd"
    missing=1
  fi
done

for key in EARTHDATA_USERNAME R2_BUCKET R2_ENDPOINT R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_PUBLIC_BASE; do
  if [[ -z "${!key:-}" ]]; then
    echo "Missing env: $key"
    missing=1
  fi
done

if [[ -z "${LAADS_DOWNLOAD_TOKEN:-${EARTHDATA_TOKEN:-}}" ]]; then
  echo "Missing env: LAADS_DOWNLOAD_TOKEN (or EARTHDATA_TOKEN fallback)"
  missing=1
fi

if [[ "$missing" -eq 1 ]]; then
  echo "Setup incomplete"
  exit 1
fi

echo "Setup looks complete"
echo "Run ./scripts/tiles/check_download_auth.sh to verify token access."
