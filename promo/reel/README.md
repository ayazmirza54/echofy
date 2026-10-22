# CLONE MODE — EP 01: Rebuilding Wispr Flow

A 60-second, 9:16 (1080×1920, 30 fps) motion-graphics reel, fully generated from code:
kinetic typography, UI animations, glitch transitions, an AMOLED-black look, and a synthesized
120 BPM soundtrack with cuts synced to the beat.

```
./build.sh                 # -> ../clone_mode_ep01.mp4 + .srt + .words.srt
CAPTIONS=0 ./build.sh      # without burned-in captions (if you add a real voiceover)
```

Needs Node 22, ffmpeg, and Playwright with Chromium. It takes about 10–15 minutes on 4 cores.

| File | What it does |
|---|---|
| `timeline.js` | The single source of truth: scene times, BPM, kicks/impacts/transitions, captions, handle, series and episode name. |
| `scene.html` | Canvas renderer; `renderFrame(t)` draws any moment. Open it in a browser to preview (`?t=34.5` freezes on a frame). |
| `render.cjs` | Drives headless Chromium frame by frame, piping the frames into ffmpeg across parallel workers. |
| `music.mjs` | Synthesizes the soundtrack (kick, hats, claps, sidechained bass, pads, arp, risers, impacts, UI SFX) from the same timeline. |
| `srt.cjs` | Writes the subtitle files (`.srt` per line, `.words.srt` word-synced) from the caption timings. |
| `build.sh` | Runs all of the above, adds film grain, and muxes the final MP4. |

## Scenes

| Time | Scene | Beats |
|---|---|---|
| 0:00–0:05 | Hook | Blinking cursor → app UIs flash with price tags → "WHY USE IT? / WHEN I CAN BUILD IT." |
| 0:05–0:12 | Challenge | Voice / launcher / workspace cards float in 3D, each gets a REBUILD stamp → "POPULAR APPS → MY OWN VERSIONS" |
| 0:12–0:22 | Target 01 | Lock-on reticle on WISPR FLOW → mic orb + waveform → raw transcript, fillers struck out → cleaned text |
| 0:22–0:34 | Montage | Prompt → generated code → npm install → preview → 23 bugs → "fix it." diff → `npm run dev` ✓✓✓ → Ready |
| 0:34–0:47 | Reveal | Drop: "IT ACTUALLY WORKS." → ECHOFY demo: messy speech in the floating pill → clean text in the email, with callouts |
| 0:47–1:00 | Teaser | Pull-back into an episode grid (EP 02/03 blurred "?") → "ONE APP. ONE CHALLENGE. UNLIMITED VIBES." → end card + follow CTA |

## Making it yours

- **Voiceover**: `clone_mode_ep01.srt` holds every VO line with its timing. Record against it, then mix your VO
  over the video (duck the music roughly 8 dB under speech).
- **Real demo footage**: scene 5 (0:35–0:47) is a motion-graphics stand-in. To make the reveal authentic, cut in a
  real screen recording of your app there.
- **Handle, titles, captions, timing**: edit `timeline.js` and rebuild.
