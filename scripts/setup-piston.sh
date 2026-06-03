#!/usr/bin/env bash
#
# Installs the language runtimes this app uses into a running Piston instance.
# The Piston Docker image ships with NO languages — they must be installed via
# the package API after the container is up.
#
# Usage:
#   ./scripts/setup-piston.sh [PISTON_BASE_URL]
# Default base URL: http://localhost:2000/api/v2/piston
#
# Requires: curl, jq
set -euo pipefail

PISTON="${1:-http://localhost:2000/api/v2/piston}"

# Piston PACKAGE names (note: these differ from runtime/language names).
#   node       -> JavaScript        gcc -> C/C++
#   typescript -> TypeScript        java -> Java        python -> Python
PACKAGES=(python node typescript java gcc)

command -v jq >/dev/null || { echo "jq is required (e.g. 'sudo apt install jq')"; exit 1; }

echo "Waiting for Piston at $PISTON ..."
for i in $(seq 1 30); do
  if curl -fs "$PISTON/runtimes" >/dev/null 2>&1; then break; fi
  sleep 1
done

AVAILABLE="$(curl -fs "$PISTON/packages")"

for pkg in "${PACKAGES[@]}"; do
  ver="$(echo "$AVAILABLE" | jq -r --arg l "$pkg" \
    '[.[] | select(.language==$l)] | sort_by(.language_version) | last | .language_version // empty')"
  if [ -z "$ver" ]; then
    echo "!! no package found for '$pkg' (skipping)"
    continue
  fi
  echo ">> installing $pkg $ver ..."
  curl -fs -X POST "$PISTON/packages" \
    -H 'Content-Type: application/json' \
    -d "{\"language\":\"$pkg\",\"version\":\"$ver\"}" >/dev/null \
    && echo "   done" || echo "   failed (may already be installed)"
done

echo
echo "Installed runtimes:"
curl -fs "$PISTON/runtimes" | jq -r '.[] | "  \(.language) \(.version)"'
