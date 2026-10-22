#!/usr/bin/env bash
# Apply a cinematic treatment to a video:
#   slow push-in, teal/orange grade, filmic contrast, vignette,
#   film grain, letterbox bars, 24fps, fade in/out.
# Usage: ./cinematic.sh input.mp4 [output.mp4]
set -euo pipefail

IN="$1"
OUT="${2:-${IN%.*}_cinematic.mp4}"

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$IN")
H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$IN")
FADE_OUT=$(awk -v d="$DUR" 'BEGIN{printf "%.3f", d-0.8}')
BAR=$(( H / 12 ))   # letterbox bar height

VF="\
fps=24,\
scale=w='trunc(${W}*(1+0.07*t/${DUR})/2)*2':h=-2:eval=frame:flags=bicubic,\
crop=${W}:${H},\
eq=contrast=1.08:saturation=0.88:gamma=0.97,\
colorbalance=rs=-0.05:gs=0.01:bs=0.07:rm=0.02:gm=-0.02:bm=0.0:rh=0.03:gh=-0.02:bh=-0.03,\
curves=master='0/0.04 0.25/0.20 0.5/0.50 0.75/0.80 1/0.96',\
unsharp=5:5:0.4,\
vignette=angle=PI/5,\
noise=alls=5:allf=t,\
drawbox=x=0:y=0:w=iw:h=${BAR}:color=black:t=fill,\
drawbox=x=0:y=ih-${BAR}:w=iw:h=${BAR}:color=black:t=fill,\
fade=t=in:st=0:d=0.8,fade=t=out:st=${FADE_OUT}:d=0.8,\
format=yuv420p"

AF="afade=t=in:st=0:d=0.8,afade=t=out:st=${FADE_OUT}:d=0.8"

ffmpeg -hide_banner -y -i "$IN" -vf "$VF" -af "$AF" \
  -c:v libx264 -preset medium -crf 21 -c:a aac -b:a 192k \
  -movflags +faststart "$OUT"

echo "Wrote $OUT"
