#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_common.sh"
load_env

require_cmd curl

OUT_DIR="${1:-$ROOT_DIR/data/viirs}"
URLS_FILE="${2:-${VIIRS_URLS_FILE:-$ROOT_DIR/scripts/tiles/viirs_urls.txt}}"

if [[ ! -f "$URLS_FILE" ]]; then
  echo "Missing URL manifest: $URLS_FILE" >&2
  echo "Copy scripts/tiles/viirs_urls.example.txt to scripts/tiles/viirs_urls.txt and add your VIIRS URLs." >&2
  exit 1
fi

download_token="${LAADS_DOWNLOAD_TOKEN:-${EARTHDATA_TOKEN:-}}"

if [[ -z "$download_token" && ! -f "$HOME/.netrc" ]]; then
  echo "Set LAADS_DOWNLOAD_TOKEN in .env.local or configure ~/.netrc for Earthdata auth." >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

downloaded=0
skipped=0
urls_seen=0
max_files="${VIIRS_MAX_FILES:-0}"

while IFS= read -r line; do
  url="$(printf '%s' "$line" | sed 's/#.*$//' | tr -d '\r' | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"

  if [[ -z "$url" ]]; then
    continue
  fi
  urls_seen=$((urls_seen + 1))

  filename="$(basename "${url%%\?*}")"
  target="$OUT_DIR/$filename"

  if [[ -f "$target" ]]; then
    skipped=$((skipped + 1))
    continue
  fi

  if [[ -n "$download_token" ]]; then
    curl -fL --location-trusted --retry 3 --retry-delay 2 \
      -H "Authorization: Bearer $download_token" \
      -H "X-Requested-With: XMLHttpRequest" \
      "$url" -o "$target"
  else
    curl -fL --location-trusted --retry 3 --retry-delay 2 \
      -H "X-Requested-With: XMLHttpRequest" \
      --netrc "$url" -o "$target"
  fi

  # Guard against auth redirects being saved as HTML.
  if head -n 5 "$target" | grep -qi '<!DOCTYPE html>'; then
    rm -f "$target"
    echo "Download returned HTML instead of data. Check LAADS_DOWNLOAD_TOKEN." >&2
    exit 1
  fi

  downloaded=$((downloaded + 1))

  if [[ "$max_files" -gt 0 && "$downloaded" -ge "$max_files" ]]; then
    break
  fi
done < "$URLS_FILE"

if [[ "$urls_seen" -eq 0 ]]; then
  echo "No URLs found in $URLS_FILE. Add VIIRS source URLs first." >&2
  exit 1
fi

echo "Downloaded: $downloaded"
echo "Skipped existing: $skipped"
echo "Output: $OUT_DIR"
