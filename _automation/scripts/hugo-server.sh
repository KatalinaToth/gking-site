#!/usr/bin/env bash
# Local preview server using the same Hugo version as CI.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

bash "$ROOT/_automation/scripts/ensure_hugo.sh"
HUGO="$ROOT/.tools/hugo-0.160.1/hugo"

exec "$HUGO" server \
  --bind 127.0.0.1 \
  --port 1313 \
  --disableFastRender \
  "$@"
