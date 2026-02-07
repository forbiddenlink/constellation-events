#!/usr/bin/env bash
set -euo pipefail

IN_DIR=${1:-./data/tiles}

if [[ -z "${R2_BUCKET:-}" || -z "${R2_ENDPOINT:-}" || -z "${R2_ACCESS_KEY_ID:-}" || -z "${R2_SECRET_ACCESS_KEY:-}" ]]; then
  echo "Missing R2 env vars. See scripts/tiles/README.md"
  exit 1
fi

export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"

aws s3 sync "$IN_DIR" "s3://$R2_BUCKET" --endpoint-url "$R2_ENDPOINT" --delete

echo "Upload complete. Configure NEXT_PUBLIC_LIGHTPOLLUTION_TILES to point to your public tile URL."
