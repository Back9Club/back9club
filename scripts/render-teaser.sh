#!/bin/bash
# Render THE BACK 9 CLUB launch teaser and export the final MP4s.
#
#   scripts/render-teaser.sh          render with the existing audio
#   scripts/render-teaser.sh --audio  rebuild the soundtrack first
#
# Outputs:
#   out/back9club-launch-teaser.mp4        voiceover + music + sound design
#   out/back9club-launch-teaser-no-vo.mp4  music + sound design only
#
# Remotion renders the picture with the audio stems mixed in. The final step
# re-muxes the mastered mix (identical to the summed stems) with a sample-exact
# trim, so the file reports exactly 19.5 s instead of 19.52 s (AAC padding).
set -euo pipefail
cd "$(dirname "$0")/.."

if [ "${1:-}" = "--audio" ]; then
  python3 scripts/audio/build_audio.py
fi

mkdir -p out
RAW=out/.teaser-raw.mp4
npx remotion render src/index.ts LaunchTeaser "$RAW" --log=error

SAMPLES=$(python3 -c "import json; t=json.load(open('src/teaser/timeline.json')); print(round(t['durationInFrames'] / t['fps'] * 48000))")
for variant in "launch-teaser:public/audio/mix.wav" "launch-teaser-no-vo:public/audio/mix-no-vo.wav"; do
  name=${variant%%:*}
  audio=${variant#*:}
  ffmpeg -v error -y -i "$RAW" -i "$audio" -map 0:v -map 1:a -c:v copy \
    -af "atrim=end_sample=$SAMPLES" -c:a aac -b:a 320k -movflags +faststart \
    "out/back9club-$name.mp4"
  echo "out/back9club-$name.mp4"
done
rm -f "$RAW"
