#!/bin/bash
# Render THE BACK 9 CLUB advert to out/back9club-advert.mp4 (exactly 18.0 s).
#
#   scripts/render-advert.sh                 render with existing 3D shot + audio
#   scripts/render-advert.sh --audio         rebuild the soundtrack first
#   scripts/render-advert.sh --ball --audio  also re-render the 3D golf ball shot
#
# The 3D shot (three.js) needs WebGL; with no GPU (e.g. the cloud sandbox) it
# renders in software with --gl=swangle, about 4 s per frame.
set -euo pipefail
cd "$(dirname "$0")/.."

for arg in "$@"; do
  case "$arg" in
    --ball)
      python3 scripts/advert/golf_ball_maps.py
      npx remotion render src/index.ts AdvertBallShot public/advert/ball-shot.mp4 \
        --gl=swangle --codec=h264 --crf=10 --muted --log=error
      ;;
    --audio) python3 scripts/advert/build_audio.py ;;
  esac
done

mkdir -p out
RAW=out/.advert-raw.mp4
npx remotion render src/index.ts Advert "$RAW" --log=error

# Re-mux the mastered mix with a sample-exact trim (AAC would pad past 18.0 s).
SAMPLES=$(python3 -c "import json; t=json.load(open('src/advert/timeline.json')); print(round(t['durationInFrames'] / t['fps'] * 48000))")
ffmpeg -v error -y -i "$RAW" -i public/audio/advert/mix.wav -map 0:v -map 1:a -c:v copy \
  -af "atrim=end_sample=$SAMPLES" -c:a aac -b:a 320k -movflags +faststart out/back9club-advert.mp4
rm -f "$RAW"
echo out/back9club-advert.mp4
