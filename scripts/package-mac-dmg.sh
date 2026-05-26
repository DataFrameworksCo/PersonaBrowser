#!/usr/bin/env bash

set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "DMG packaging requires macOS because electron-builder uses hdiutil." >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

npm run build
./node_modules/.bin/electron-builder --config electron-builder.yml --mac dmg --publish never
