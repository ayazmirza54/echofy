#!/usr/bin/env bash
# Renders the CLONE MODE EP01 reel: visuals (scene.html via headless Chromium),
# synthesized soundtrack (music.mjs), then grades/grains and muxes with ffmpeg.
# Usage: ./build.sh [output.mp4]     (edit timeline.js for handle, captions, timing)
#   CAPTIONS=0 ./build.sh   -> no burned-in captions (when adding a real voiceover)
set -euo pipefail

cd "$(dirname "$0")"
OUT="$(realpath -m "${1:-../clone_mode_ep01.mp4}")"
WORK="${WORK:-$(mktemp -d)}"; mkdir -p "$WORK"
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"

if [ "${CAPTIONS:-1}" = "0" ]; then sed -i.bak 's/?render=1/?render=1\&captions=0/' render.cjs; trap 'mv render.cjs.bak render.cjs' EXIT; fi

echo "[1/3] soundtrack"
node music.mjs "$WORK/music.wav"
echo "[2/3] frames"
node render.cjs "$WORK" --workers "${WORKERS:-4}"
echo "[3/3] grade + mux"
ffmpeg -hide_banner -loglevel error -y \
  -f concat -safe 0 -i "$WORK/segments.txt" -i "$WORK/music.wav" \
  -vf "noise=alls=3:allf=t,format=yuv420p" \
  -c:v libx264 -preset medium -crf 20 -maxrate 12M -bufsize 24M -profile:v high -r 30 \
  -c:a aac -b:a 256k -shortest -movflags +faststart "$OUT"
node srt.cjs "${OUT%.*}"
echo "Wrote $OUT"
