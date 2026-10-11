#!/bin/bash
# Render FIFTEEN to out/fifteen.mp4 (exactly 15.0 s, H.264 + AAC).
#
#   scripts/render-fifteen.sh          render with the existing soundtrack
#   scripts/render-fifteen.sh --audio  rebuild the soundtrack first
set -euo pipefail
cd "$(dirname "$0")/.."

if [ "${1:-}" = "--audio" ]; then
  python3 scripts/audio/build_fifteen.py
fi

mkdir -p out
RAW=out/.fifteen-raw.mp4
npx remotion render src/index.ts Fifteen "$RAW" --log=error

# Re-mux the mastered mix with a sample-exact trim (AAC would pad to 15.02 s).
SAMPLES=$(python3 -c "import json; t=json.load(open('src/fifteen/timeline.json')); print(round(t['durationInFrames'] / t['fps'] * 48000))")
ffmpeg -v error -y -i "$RAW" -i public/audio/fifteen/mix.wav -map 0:v -map 1:a -c:v copy \
  -af "atrim=end_sample=$SAMPLES" -c:a aac -b:a 320k -movflags +faststart out/fifteen.mp4
rm -f "$RAW"
echo out/fifteen.mp4
