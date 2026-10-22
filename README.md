# Echofy

A small, fully-local **push-to-talk voice dictation** tool for Windows.

Hold a hotkey, speak, release — your speech is transcribed on your own machine
with [Whisper](https://github.com/openai/whisper) (via `faster-whisper`) and
typed into whatever window has focus. No cloud, no API keys, no account.

It injects real keystrokes, so it works the same inside a **Remote Desktop (RDP)**
session as it does on the local desktop.

This is an original implementation — not affiliated with or derived from any
commercial dictation product.

---

## Quick start

1. Install **Python 3.9–3.12** (64-bit) and tick *"Add Python to PATH"*.
2. Double-click **`run.bat`**.
   - First run creates a local virtual environment and installs dependencies.
   - The first dictation downloads the Whisper model (a few hundred MB for
     `base.en`); this happens once.
3. A console window opens. Put your cursor in any text field, **hold
   `Right Ctrl`**, speak, then **release**. The text types itself in.
4. Quit with `Ctrl+C` in the console.

Prefer manual setup?

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

---

## Configuration

Settings live in `Echofy_config.json` (created automatically next to the
script). Edit it and restart the app.

| Key             | What it does                                                        | Default        |
|-----------------|---------------------------------------------------------------------|----------------|
| `hotkey`        | Key held to dictate. e.g. `right ctrl`, `f9`, `ctrl+alt+space`       | `right ctrl`   |
| `model`         | `tiny.en` / `base.en` / `small.en` / `medium.en` / `large-v3`        | `base.en`      |
| `device`        | `cpu` or `cuda`                                                      | `cpu`          |
| `compute_type`  | `int8` (CPU) or `float16` (GPU)                                      | `int8`         |
| `language`      | `"en"`, or `null` to auto-detect                                    | `en`           |
| `inject_mode`   | `type` (keystrokes, most compatible) or `paste` (clipboard + Ctrl+V)| `type`         |
| `trailing_space`| Add a space after each dictation                                    | `true`         |
| `beep`          | Beep on start/stop of recording                                     | `true`         |

**Accuracy vs. speed:** `base.en` is a good default. Move up to `small.en` or
`medium.en` for better accuracy if your CPU can keep up; drop to `tiny.en` on a
slow machine. With an NVIDIA GPU, set `device: "cuda"` and
`compute_type: "float16"` for a big speedup.

---

## Using it over RDP

Two things matter in a remote session:

1. **Microphone** — the mic must reach the remote machine. In the RDP client
   (*Remote Desktop Connection → Show Options → Local Resources → Remote audio →
   Settings*), set **"Remote audio recording"** to *"Record from this computer"*.
   Then run Echofy on the **remote** machine.
2. **Typing** — no special setup. Echofy types with standard Windows input,
   which RDP forwards like any keyboard.

If you'd rather capture audio on your local PC, run Echofy locally with
`inject_mode: "paste"` and paste into the remote window — but the setup above
(running it remotely) is simpler and keeps everything in one place.

---

## How it works

```
 hold hotkey ─▶ sounddevice records mic (16 kHz mono)
 release     ─▶ faster-whisper transcribes locally
             ─▶ keyboard.write() types the text into the focused app
```

- `config.py` — load/save settings with sane defaults.
- `main.py` — audio capture (`Recorder`), transcription (`Transcriber`),
  text injection (`inject_text`), and the hotkey loop (`Echofy`).

---

## Troubleshooting

- **Hotkey does nothing / can't type into an elevated app.** The `keyboard`
  library needs the same (or higher) privilege as the target window. If you
  dictate into an app running as Administrator, run Echofy as Administrator
  too.
- **No audio / empty transcripts.** Check Windows *Sound settings → Input* and
  that the right mic is the default. Over RDP, see the section above.
- **First dictation is slow.** The model loads on first use; it's warmed in the
  background at startup, so give it a few seconds after launch.
- **`OSError: PortAudio` on start.** Reinstall `sounddevice`
  (`pip install --force-reinstall sounddevice`).

---

## Notes

- Everything runs offline. Audio never leaves your machine.
- Models are cached by `faster-whisper` under your user profile
  (`%USERPROFILE%\.cache\huggingface`) and reused across runs.

---

## Launch content

Everything for the **CLONE MODE — EP 01** launch lives in [`promo/`](promo/README.md):
the 60s vertical reel (`promo/clone_mode_ep01.mp4`), its subtitles, the 8-slide Instagram
carousel, and the code that generates all of it.
