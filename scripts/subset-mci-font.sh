#!/usr/bin/env bash
# Subset MaterialCommunityIcons.ttf to only the glyphs the app uses.
# Without this, the full ~1.1MB font (6,596 glyphs) ships in the APK.
#
# Run after `npm install` (a postinstall hook does this automatically).
# When adding a new MCI icon, add its codepoint here and re-run.
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$PROJECT_ROOT/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf"
DST="$SRC"
SUBSET="$PROJECT_ROOT/assets/fonts/MaterialCommunityIcons.ttf"

# Glyphs in use (keep alphabetical, match icon names in src/):
#   approximately-equal-box, bullseye-arrow, chart-line, chart-line-variant,
#   chevron-right, close, cog-outline, delete-outline, lightbulb-on-outline,
#   logout-variant, pulse, trash-can-outline
UNICODES="F0F9F,F08C9,F07B1,F012A,F0142,F0156,F08BB,F09E7,F06E9,F05FD,F0430,F0A7A"

if [ ! -f "$SRC" ]; then
  echo "[subset-mci] node_modules MCI font missing — skipping (run after npm install)."
  exit 0
fi

ORIG_SIZE=$(wc -c < "$SRC" | tr -d ' ')
if [ "$ORIG_SIZE" -lt 100000 ]; then
  echo "[subset-mci] Already subset ($ORIG_SIZE bytes) — skipping."
  exit 0
fi

PYFT="$(command -v pyftsubset || true)"
if [ -z "$PYFT" ]; then
  PYFT="$HOME/Library/Python/3.9/bin/pyftsubset"
fi
if [ ! -x "$PYFT" ]; then
  echo "[subset-mci] pyftsubset not found. Install with: pip3 install --user fonttools"
  exit 1
fi

mkdir -p "$(dirname "$SUBSET")"
"$PYFT" "$SRC" \
  --unicodes="$UNICODES" \
  --output-file="$SUBSET" \
  --no-hinting \
  --desubroutinize \
  --layout-features='*' \
  >/dev/null 2>&1

cp "$SUBSET" "$DST"
NEW_SIZE=$(wc -c < "$DST" | tr -d ' ')
echo "[subset-mci] $ORIG_SIZE → $NEW_SIZE bytes (saved $((ORIG_SIZE - NEW_SIZE)))"
