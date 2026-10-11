#!/bin/bash
# SessionStart hook for Claude Code cloud sessions: installs dependencies and a
# Chrome Headless Shell so Remotion can render videos inside the sandbox.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

npm install --no-audit --no-fund --loglevel=error > /dev/null

# Python libraries for the teaser soundtrack (scripts/audio/build_audio.py).
python3 -c "import numpy, scipy" 2> /dev/null \
  || pip install --quiet --disable-pip-version-check numpy scipy > /dev/null 2>&1

# Remotion downloads its browser from remotion.media, which the sandbox network
# policy blocks. Fetch the exact Chrome version this Remotion release is tested
# against from Google's Chrome for Testing CDN instead.
CHROME_VERSION=$(grep -oP "TESTED_VERSION = '\K[^']+" \
  node_modules/@remotion/renderer/dist/browser/get-chrome-download-url.js)
CHROME_DIR="$HOME/.cache/remotion-chrome/$CHROME_VERSION"
CHROME_BIN="$CHROME_DIR/chrome-headless-shell-linux64/chrome-headless-shell"

if [ ! -x "$CHROME_BIN" ]; then
  mkdir -p "$CHROME_DIR"
  curl -fsSL --retry 3 -o "$CHROME_DIR/chrome.zip" \
    "https://storage.googleapis.com/chrome-for-testing-public/$CHROME_VERSION/linux64/chrome-headless-shell-linux64.zip"
  unzip -q -o "$CHROME_DIR/chrome.zip" -d "$CHROME_DIR"
  rm "$CHROME_DIR/chrome.zip"
fi

# remotion.config.ts picks this up. (The sandbox has no GPU: renders that use
# WebGL, e.g. shader transitions or light leaks, need --gl=swangle.)
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export REMOTION_BROWSER_EXECUTABLE=\"$CHROME_BIN\"" >> "$CLAUDE_ENV_FILE"
fi
