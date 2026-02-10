#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_common.sh"
load_env

require_cmd aws
require_env R2_BUCKET R2_ENDPOINT R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_PUBLIC_BASE

PREFIX="${R2_TILE_PREFIX:-lightpollution}"
IN_DIR="${1:-$ROOT_DIR/data/tiles/$PREFIX}"
CACHE_CONTROL="${TILE_CACHE_CONTROL:-public, max-age=3600}"

if [[ ! -d "$IN_DIR" ]]; then
  echo "Missing tile directory: $IN_DIR" >&2
  exit 1
fi

export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"

aws s3 sync "$IN_DIR/" "s3://$R2_BUCKET/$PREFIX/" \
  --endpoint-url "$R2_ENDPOINT" \
  --delete \
  --cache-control "$CACHE_CONTROL"

tile_url="${R2_PUBLIC_BASE%/}/$PREFIX/{z}/{x}/{y}.png"

echo "Uploaded to: s3://$R2_BUCKET/$PREFIX/"
echo "Public tile URL: $tile_url"

if [[ "${UPDATE_ENV_LOCAL:-false}" == "true" ]]; then
  update_env_var "NEXT_PUBLIC_LIGHTPOLLUTION_TILES" "$tile_url"
  echo "Updated NEXT_PUBLIC_LIGHTPOLLUTION_TILES in ${ENV_FILE:-$DEFAULT_ENV_FILE}"
fi
