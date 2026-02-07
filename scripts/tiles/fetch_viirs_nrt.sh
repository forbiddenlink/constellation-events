#!/usr/bin/env bash
set -euo pipefail

OUT_DIR=${1:-./data/viirs}
mkdir -p "$OUT_DIR"

cat <<'MSG'
This script is a placeholder for downloading VIIRS NRT night-lights data.

Next steps:
- Create a NASA Earthdata account and login
- Use curl or wget with .netrc auth
- Save the selected granules into $OUT_DIR

We will provide the exact download URLs once you confirm your Earthdata login.
MSG
