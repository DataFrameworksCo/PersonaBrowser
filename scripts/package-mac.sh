#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="$(node -p "require('$ROOT_DIR/package.json').version")"

cd "$ROOT_DIR"

npm run build

./node_modules/.bin/electron-builder --config electron-builder.yml --mac zip --x64 --publish never
./node_modules/.bin/electron-builder --config electron-builder.yml --mac zip --arm64 --publish never

rm -f "release/PersonaBrowser-${VERSION}-x64-fixed.zip" "release/PersonaBrowser-${VERSION}-arm64-fixed.zip"

(
  cd release/mac
  zip -yr "../PersonaBrowser-${VERSION}-x64-fixed.zip" "Persona Browser.app"
)

(
  cd release/mac-arm64
  zip -yr "../PersonaBrowser-${VERSION}-arm64-fixed.zip" "Persona Browser.app"
)

echo "Created fixed macOS archives:"
echo "  release/PersonaBrowser-${VERSION}-x64-fixed.zip"
echo "  release/PersonaBrowser-${VERSION}-arm64-fixed.zip"
