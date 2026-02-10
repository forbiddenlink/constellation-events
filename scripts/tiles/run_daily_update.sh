#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_common.sh"
load_env

LOCK_FILE="${LOCK_FILE:-$ROOT_DIR/data/tiles/.pipeline.lock}"
LOG_DIR="${LOG_DIR:-$ROOT_DIR/data/logs}"
mkdir -p "$LOG_DIR"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "Another tile update is already running"
  exit 1
fi

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
log_file="$LOG_DIR/tile-update-$stamp.log"

{
  echo "[$(date -u)] Starting daily tile update"
  "$SCRIPT_DIR/run_pipeline.sh"
  if [[ "${ENABLE_LOCAL_CLEANUP:-true}" == "true" ]]; then
    "$SCRIPT_DIR/cleanup_local_data.sh"
  fi
  echo "[$(date -u)] Finished daily tile update"
} | tee "$log_file"
