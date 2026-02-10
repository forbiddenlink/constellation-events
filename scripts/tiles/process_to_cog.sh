#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_common.sh"
load_env

require_cmd find gdalbuildvrt gdalwarp gdal_translate gdalinfo

IN_DIR="${1:-$ROOT_DIR/data/viirs}"
OUT_DIR="${2:-$ROOT_DIR/data/cogs}"
COG_DATE="$(date -u +%Y%m%d)"

mkdir -p "$OUT_DIR"

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/constellation-cog.XXXXXX")"
trap 'rm -rf "$tmp_dir"' EXIT

tif_inputs=()
while IFS= read -r line; do
  tif_inputs+=("$line")
done < <(find "$IN_DIR" -type f \( -iname '*.tif' -o -iname '*.tiff' \) | sort)

h5_inputs=()
while IFS= read -r line; do
  h5_inputs+=("$line")
done < <(find "$IN_DIR" -type f \( -iname '*.h5' -o -iname '*.hdf' \) | sort)

converted=()
subdataset_pattern="${H5_SUBDATASET_PATTERN:-Gap_Filled_DNB_BRDF-Corrected_NTL|DNB_BRDF-Corrected_NTL|NTL}"
idx=0
for h5 in "${h5_inputs[@]}"; do
  subdataset="$(gdalinfo "$h5" | awk -F= '/SUBDATASET_[0-9]+_NAME=/{print $2}' | grep -E "$subdataset_pattern" | head -n 1 || true)"
  if [[ -z "$subdataset" ]]; then
    continue
  fi
  out_tif="$tmp_dir/h5_${idx}.tif"
  gdal_translate "$subdataset" "$out_tif" -co TILED=YES -co COMPRESS=DEFLATE
  converted+=("$out_tif")
  idx=$((idx + 1))
done

inputs=()
for tif in "${tif_inputs[@]:-}"; do
  if [[ -n "$tif" ]]; then
    inputs+=("$tif")
  fi
done
for tif in "${converted[@]:-}"; do
  if [[ -n "$tif" ]]; then
    inputs+=("$tif")
  fi
done
if [[ "${#inputs[@]}" -eq 0 ]]; then
  echo "No usable raster inputs found in $IN_DIR" >&2
  echo "Expected .tif/.tiff or .h5 with a subdataset matching $subdataset_pattern" >&2
  exit 1
fi

vrt="$tmp_dir/merged.vrt"
warped="$tmp_dir/warped_3857.tif"
out_cog="$OUT_DIR/lightpollution_${COG_DATE}.tif"
out_latest="$OUT_DIR/lightpollution_latest.tif"

gdalbuildvrt "$vrt" "${inputs[@]}"

gdalwarp \
  -t_srs EPSG:3857 \
  -r bilinear \
  -multi \
  -wo NUM_THREADS=ALL_CPUS \
  -dstnodata 0 \
  -co TILED=YES \
  -co COMPRESS=DEFLATE \
  "$vrt" "$warped"

gdal_translate \
  -of COG \
  -co COMPRESS=DEFLATE \
  -co LEVEL=9 \
  -co BIGTIFF=IF_SAFER \
  -co NUM_THREADS=ALL_CPUS \
  "$warped" "$out_cog"

cp "$out_cog" "$out_latest"

echo "Created COG: $out_cog"
echo "Updated latest: $out_latest"
