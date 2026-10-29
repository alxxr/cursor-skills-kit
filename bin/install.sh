#!/usr/bin/env bash
# Wrapper → bin/install.mjs (skills-cli + agency-agents).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec node "$ROOT/bin/install.mjs" "$@"
