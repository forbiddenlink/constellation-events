#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_common.sh"
load_env

require_cmd curl python3

OUT_FILE="${1:-$ROOT_DIR/scripts/tiles/viirs_urls.txt}"
TARGET_DATE="${2:-${VIIRS_TARGET_DATE:-$(date -u -v-1d +%Y-%m-%d 2>/dev/null || date -u -d 'yesterday' +%Y-%m-%d)}}"
COLLECTION_ID="${VIIRS_COLLECTION_ID:-C3363944097-LANCEMODIS}"
PAGE_SIZE="${VIIRS_PAGE_SIZE:-2000}"

start="${TARGET_DATE}T00:00:00Z"
end="${TARGET_DATE}T23:59:59Z"
query_url="https://cmr.earthdata.nasa.gov/search/granules.json?collection_concept_id=${COLLECTION_ID}&page_size=${PAGE_SIZE}&sort_key=producer_granule_id&temporal=${start},${end}"

tmp_json="$(mktemp "${TMPDIR:-/tmp}/cmr-granules.XXXXXX.json")"
trap 'rm -f "$tmp_json"' EXIT

curl -fsSL "$query_url" -o "$tmp_json"

mkdir -p "$(dirname "$OUT_FILE")"
python3 - "$tmp_json" "$OUT_FILE" <<'PY'
import json
import sys

in_path, out_path = sys.argv[1], sys.argv[2]
with open(in_path, "r", encoding="utf-8") as f:
    payload = json.load(f)

entries = payload.get("feed", {}).get("entry", [])
urls = set()
for entry in entries:
    for link in entry.get("links", []):
        href = link.get("href", "")
        rel = link.get("rel", "")
        if not href:
            continue
        if not rel.endswith("/data#"):
            continue
        if "/api/v2/content/archives/allData/" not in href:
            continue
        urls.add(href.replace("/api/v2/content/archives/", "/archive/"))

with open(out_path, "w", encoding="utf-8") as f:
    for url in sorted(urls):
        f.write(url + "\n")

print(len(urls))
PY

count="$(wc -l < "$OUT_FILE" | tr -d ' ')"
if [[ "$count" -eq 0 ]]; then
  echo "No VIIRS URLs found for $TARGET_DATE (collection $COLLECTION_ID)" >&2
  exit 1
fi

echo "Generated $OUT_FILE with $count URLs for $TARGET_DATE"
