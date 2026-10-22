# echofy

Content for **CLONE MODE — EP 01: Rebuilding Wispr Flow**, a voice-dictation app vibe-coded from scratch
with local, open-source Whisper. Everything here is generated from code.

| Path | What it is |
|---|---|
| `clone_mode_ep01.mp4` | 60s, 9:16 motion-graphics reel with a synthesized soundtrack |
| `clone_mode_ep01.srt` | Subtitles, one cue per voiceover line |
| `clone_mode_ep01.words.srt` | Word-synced subtitles (Reels/Shorts style) |
| `reel/` | Source for the reel: canvas scenes, frame renderer, music synth, build script ([README](reel/README.md)) |
| `carousel/` | 8-slide 1080×1350 Instagram carousel and its source ([README](carousel/README.md)) |
| `cinematic.sh` | ffmpeg script that gives any clip a cinematic grade, push-in, grain and letterbox |
| `VID_20261018_140800*.mp4` | Source clip and its `cinematic.sh` render |

Rebuild the reel with `reel/build.sh` and the carousel with `node carousel/render.cjs`
(both need Node 22, ffmpeg and Playwright/Chromium).
