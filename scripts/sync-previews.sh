#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE_DIR="$(cd "$ROOT_DIR/.." && pwd)"

SRC_SVG="$WORKSPACE_DIR/theme_previews_svg/"
SRC_PNG="$WORKSPACE_DIR/theme_previews_png/"
DST_SVG="$ROOT_DIR/public/previews/"
DST_PNG="$ROOT_DIR/public/previews_png/"

mkdir -p "$DST_SVG" "$DST_PNG"

echo "Syncing SVG previews..." >&2
rsync -a --delete "$SRC_SVG" "$DST_SVG"

echo "Syncing PNG previews..." >&2
rsync -a --delete "$SRC_PNG" "$DST_PNG"

echo "Preview sync completed." >&2
