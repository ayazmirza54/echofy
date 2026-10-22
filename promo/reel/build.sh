#!/usr/bin/env bash
# Renders the CLONE MODE EP01 reel: TTS voiceover (voiceover.py), visuals
# (scene.html via headless Chromium), synthesized soundtrack (music.mjs), then
# grades/grains, ducks the music under the voice and muxes with ffmpeg.
# Usage: ./build.sh [output.mp4]     (edit timeline.js for handle, captions, timing)
#   CAPTIONS=0 ./build.sh   -> no burned-in captions
#   VO=0 ./build.sh         -> music and SFX only, no voiceover
#   TTS_PYTHON=/path/to/python KOKORO_DIR=/path/to/models -> see voiceover.py
set -euo pipefail

cd "$(dirname "$0")"
OUT="$(realpath -m "${1:-../clone_mode_ep01.mp4}")"
WORK="${WORK:-$(mktemp -d)}"; mkdir -p "$WORK"
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"

if [ "${CAPTIONS:-1}" = "0" ]; then sed -i.bak 's/?render=1/?render=1\&captions=0/' render.cjs; trap 'mv render.cjs.bak render.cjs' EXIT; fi

echo "[1/4] voiceover"
if [ "${VO:-1}" = "0" ]; then
  rm -f vo_timing.js
  ffmpeg -hide_banner -loglevel error -y -f lavfi -i anullsrc=r=24000:cl=mono -t 60 "$WORK/voiceover.wav"
else
  "${TTS_PYTHON:-python3}" voiceover.py "$WORK"
fi
echo "[2/4] soundtrack"
node music.mjs "$WORK/music.wav"
echo "[3/4] frames"
node render.cjs "$WORK" --workers "${WORKERS:-4}"
echo "[4/4] grade + mix + mux"
ffmpeg -hide_banner -loglevel error -y \
  -f concat -safe 0 -i "$WORK/segments.txt" -i "$WORK/music.wav" -i "$WORK/voiceover.wav" \
  -filter_complex "\
[0:v]noise=alls=3:allf=t,format=yuv420p[v];\
[2:a]aresample=44100,aformat=channel_layouts=stereo,highpass=f=70,equalizer=f=3000:t=q:w=1:g=3,\
acompressor=threshold=0.1:ratio=3:attack=5:release=80:makeup=2,volume=1.5,asplit=2[vo][key];\
[1:a]volume=0.7[m];[m][key]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=350[duck];\
[duck][vo]amix=inputs=2:normalize=0,alimiter=limit=0.94[a]" \
  -map "[v]" -map "[a]" \
  -c:v libx264 -preset medium -crf 20 -maxrate 12M -bufsize 24M -profile:v high -r 30 \
  -c:a aac -b:a 256k -shortest -movflags +faststart "$OUT"
node srt.cjs "${OUT%.*}"
echo "Wrote $OUT"
