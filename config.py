"""Configuration loading/saving for Echofy.

Settings live in a JSON file next to this script (Echofy_config.json).
Missing keys fall back to the defaults below, so an old or partial config
file keeps working after an upgrade.
"""

import json
import os

CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           "Echofy_config.json")

DEFAULTS = {
    # Hotkey held down to dictate. Uses the `keyboard` library's names.
    # Examples: "right ctrl", "f9", "ctrl+alt+space", "scroll lock".
    "hotkey": "right ctrl",

    # Whisper model size. Larger = more accurate but slower / more RAM.
    #   tiny.en  base.en  small.en  medium.en  large-v3
    # The ".en" variants are English-only and noticeably faster.
    "model": "base.en",

    # "cpu" or "cuda". "cpu" works everywhere (including RDP sessions).
    "device": "cpu",

    # int8 is the fastest/lightest on CPU. On GPU try "float16".
    "compute_type": "int8",

    # Microphone sample rate. Whisper wants 16 kHz; leave this alone.
    "sample_rate": 16000,

    # Language hint ("en"), or null to auto-detect.
    "language": "en",

    # How to put text into the focused app:
    #   "type"  -> simulate keystrokes (most compatible, great over RDP)
    #   "paste" -> copy to clipboard and send Ctrl+V (faster for long text)
    "inject_mode": "type",

    # Add a trailing space after each dictation so words don't run together.
    "trailing_space": True,

    # Play a short console beep when recording starts/stops.
    "beep": True,
}


def load_config():
    cfg = dict(DEFAULTS)
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                user = json.load(f)
            if isinstance(user, dict):
                cfg.update({k: user[k] for k in user if k in DEFAULTS})
        except (OSError, ValueError) as exc:
            print(f"[config] Could not read {CONFIG_PATH}: {exc}. Using defaults.")
    else:
        # Write a starter file so the user has something to edit.
        save_config(cfg)
    return cfg


def save_config(cfg):
    try:
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2)
    except OSError as exc:
        print(f"[config] Could not write {CONFIG_PATH}: {exc}")
