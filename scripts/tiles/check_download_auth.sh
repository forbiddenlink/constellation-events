#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_common.sh"
load_env

require_cmd curl

URLS_FILE="${1:-${VIIRS_URLS_FILE:-$ROOT_DIR/scripts/tiles/viirs_urls.txt}}"
if [[ ! -f "$URLS_FILE" ]]; then
  echo "Missing URL manifest: $URLS_FILE" >&2
  exit 1
fi

test_url="$(grep -Ev '^[[:space:]]*(#|$)' "$URLS_FILE" | head -n 1 || true)"
if [[ -z "$test_url" ]]; then
  echo "No usable URLs in $URLS_FILE" >&2
  exit 1
fi

download_token="${LAADS_DOWNLOAD_TOKEN:-${EARTHDATA_TOKEN:-}}"
if [[ -z "$download_token" ]]; then
  echo "Missing LAADS_DOWNLOAD_TOKEN (or EARTHDATA_TOKEN fallback)." >&2
  exit 1
fi

status_code="$(curl -sS -L --location-trusted -o /dev/null -w '%{http_code}' \
  -H "Authorization: Bearer $download_token" \
  -H "X-Requested-With: XMLHttpRequest" \
  "$test_url")"

if [[ "$status_code" != "200" && "$status_code" != "206" ]]; then
  echo "Auth test failed: HTTP $status_code" >&2
  echo "Generate a fresh LAADS download token and set LAADS_DOWNLOAD_TOKEN in .env.local" >&2
  exit 1
fi

echo "Auth test passed: HTTP $status_code"
