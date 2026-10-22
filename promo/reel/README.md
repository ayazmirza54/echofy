# CLONE MODE — EP 01: Rebuilding Wispr Flow

A 60-second, 9:16 (1080×1920, 30 fps) motion-graphics reel, fully generated from code:
kinetic typography, UI animations, glitch transitions, an AMOLED-black look, a neural text-to-speech
voiceover, and a synthesized 120 BPM soundtrack with cuts synced to the beat.

```
./build.sh                 # -> ../clone_mode_ep01.mp4 + .srt + .words.srt
CAPTIONS=0 ./build.sh      # without burned-in captions
VO=0 ./build.sh            # music and SFX only, no voiceover
```

Needs Node 22, ffmpeg, and Playwright with Chromium. It takes about 10–15 minutes on 4 cores.

The voiceover uses [Kokoro](https://github.com/thewh1teagle/kokoro-onnx), an open-source TTS model
that runs locally: `pip install kokoro-onnx soundfile`, download `kokoro-v1.0.onnx` and `voices-v1.0.bin`
from that repo's releases into this folder (or point `KOKORO_DIR` at them), and set `TTS_PYTHON` if
kokoro-onnx lives in a venv. Pick the voice and speed in `timeline.js` (`tts`).

| File | What it does |
|---|---|
| `timeline.js` | The single source of truth: scene times, BPM, kicks/impacts/transitions, voiceover lines/captions, TTS voice, handle, series and episode name. |
| `voiceover.py` | Speaks every caption line with Kokoro at its cue; writes the VO track and `vo_timing.js` so caption words pop in as they are spoken. |
| `scene.html` | Canvas renderer; `renderFrame(t)` draws any moment. Open it in a browser to preview (`?t=34.5` freezes on a frame). |
| `render.cjs` | Drives headless Chromium frame by frame, piping the frames into ffmpeg across parallel workers. |
| `music.mjs` | Synthesizes the soundtrack (kick, hats, claps, sidechained bass, pads, arp, risers, impacts, UI SFX) from the same timeline. |
| `srt.cjs` | Writes the subtitle files (`.srt` per line, `.words.srt` word-synced) from the caption timings. |
| `build.sh` | Runs all of the above, adds film grain, ducks the music under the voice, and muxes the final MP4. |

## Scenes

| Time | Scene | Beats |
|---|---|---|
| 0:00–0:05 | Hook | Blinking cursor → app UIs flash with price tags → "WHY USE IT? / WHEN I CAN BUILD IT." |
| 0:05–0:12 | Challenge | Voice / launcher / workspace cards float in 3D, each gets a REBUILD stamp → "POPULAR APPS → MY OWN VERSIONS" |
| 0:12–0:22 | Target 01 | Lock-on reticle on WISPR FLOW → Right Ctrl held + waveform → `[rec]` console lines → text typed into Notepad |
| 0:22–0:34 | Montage | Prompt → Echofy's `Transcriber` code → `run.bat` setup → ctranslate2 has no Python 3.13 wheels, 23 bugs → "fix it." `run.bat` diff → startup banner, model ready |
| 0:34–0:47 | Reveal | Drop: "IT ACTUALLY WORKS." → ECHOFY demo: hold Right Ctrl (beep), console logs, transcript typed into an email → callouts: push-to-talk, local Whisper, types anywhere, works over RDP |
| 0:47–1:00 | Teaser | Pull-back into an episode grid (EP 02/03 blurred "?") → "ONE APP. ONE CHALLENGE. UNLIMITED VIBES." → end card + follow CTA |

## Making it yours

- **Voiceover**: edit the lines in `timeline.js` (`captions`) and rebuild; `voiceover.py` warns when a line runs
  longer than its slot. To use your own voice instead, record against `clone_mode_ep01.srt` and build with `VO=0`.
- **Real demo footage**: scene 5 (0:35–0:47) is a motion-graphics stand-in. To make the reveal authentic, cut in a
  real screen recording of your app there.
- **Handle, titles, captions, timing**: edit `timeline.js` and rebuild.
