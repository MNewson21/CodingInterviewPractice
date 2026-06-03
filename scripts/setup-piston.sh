#!/usr/bin/env bash
#
# Installs language runtimes into a running Piston instance.
# The Piston Docker image ships with NO languages — install them via the package
# API after the container is up.
#
# Usage:
#   ./scripts/setup-piston.sh [PISTON_BASE_URL]
#   PISTON_PACKAGES="python node" ./scripts/setup-piston.sh   # custom set
#
# Default base URL: http://localhost:2000/api/v2/piston
#
# LIGHT default set (Python + JavaScript + TypeScript) keeps memory low so it runs
# on a small box like an AWS t3.micro (1 GB). The heavy compilers (Java, C++/gcc)
# are omitted by default — add them only on a larger instance:
#   PISTON_PACKAGES="python node typescript java gcc" ./scripts/setup-piston.sh
#
# Piston PACKAGE names (differ from runtime/language names):
#   node -> JavaScript   typescript -> TypeScript   python -> Python
#   java -> Java         gcc -> C/C++
#
# Requires: curl, jq
set -euo pipefail

PISTON="${1:-http://localhost:2000/api/v2/piston}"
read -ra PACKAGES <<< "${PISTON_PACKAGES:-python node typescript}"

command -v jq >/dev/null || { echo "jq is required (e.g. 'sudo apt install jq')"; exit 1; }

echo "Installing packages: ${PACKAGES[*]}"
echo "Waiting for Piston at $PISTON ..."
for _ in $(seq 1 30); do
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
