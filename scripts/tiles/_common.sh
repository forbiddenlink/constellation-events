#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEFAULT_ENV_FILE="$ROOT_DIR/.env.local"

load_env() {
  local env_file="${ENV_FILE:-$DEFAULT_ENV_FILE}"
  if [[ -f "$env_file" ]]; then
    # shellcheck disable=SC1090
    set -a; source "$env_file"; set +a
  fi
}

require_cmd() {
  local cmd
  for cmd in "$@"; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      echo "Missing command: $cmd" >&2
      exit 1
    fi
  done
}

require_env() {
  local key
  for key in "$@"; do
    if [[ -z "${!key:-}" ]]; then
      echo "Missing required env var: $key" >&2
      exit 1
    fi
  done
}

update_env_var() {
  local key="$1"
  local value="$2"
  local env_file="${ENV_FILE:-$DEFAULT_ENV_FILE}"

  if [[ ! -f "$env_file" ]]; then
    printf '%s=%s\n' "$key" "$value" > "$env_file"
    return
  fi

  if grep -q "^${key}=" "$env_file"; then
    awk -v k="$key" -v v="$value" 'BEGIN { FS=OFS="=" } $1==k { $0=k"="v } { print }' "$env_file" > "$env_file.tmp"
    mv "$env_file.tmp" "$env_file"
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$env_file"
  fi
}
