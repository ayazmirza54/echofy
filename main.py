"""Echofy - a local push-to-talk voice dictation tool.

Hold a global hotkey, speak, release. Your speech is transcribed locally
with Whisper and typed into whatever window currently has focus. Because it
injects real keystrokes (or a clipboard paste), it works inside remote
sessions (RDP) just as it does on the local desktop.

Run:  python main.py
Quit: press Ctrl+C in this console, or use the tray icon's Quit item.
"""

import queue
import sys
import threading
import time

import numpy as np
import sounddevice as sd

import config

# ---------------------------------------------------------------------------
# These two imports can fail on a fresh machine (missing wheels, no GPU libs).
# We import them lazily-ish and give a clear message instead of a traceback.
# ---------------------------------------------------------------------------
try:
    import keyboard  # global hotkeys + keystroke injection
except Exception as exc:  # pragma: no cover - environment dependent
    print("Failed to import 'keyboard'. Install requirements and, on Windows,"
          " run this console as the same user as the target app.")
    print(f"  ({exc})")
    sys.exit(1)


class Transcriber:
    """Wraps faster-whisper. The model loads once, on first use."""

    def __init__(self, cfg):
        self.cfg = cfg
        self._model = None

    def load(self):
        if self._model is not None:
            return
        try:
            from faster_whisper import WhisperModel
        except Exception as exc:
            print("Failed to import faster-whisper. Run: pip install -r requirements.txt")
            raise
        print(f"[model] Loading Whisper '{self.cfg['model']}' "
              f"({self.cfg['device']}/{self.cfg['compute_type']})... "
              "first run downloads the model, please wait.")
        t0 = time.time()
        self._model = WhisperModel(
            self.cfg["model"],
            device=self.cfg["device"],
            compute_type=self.cfg["compute_type"],
        )
        print(f"[model] Ready in {time.time() - t0:.1f}s.")

    def transcribe(self, audio_f32):
        """audio_f32: mono float32 numpy array at the configured sample rate."""
        self.load()
        lang = self.cfg["language"] or None
        segments, _ = self._model.transcribe(
            audio_f32,
            language=lang,
            beam_size=5,
            vad_filter=True,  # drop leading/trailing silence
        )
        return "".join(seg.text for seg in segments).strip()


class Recorder:
    """Captures microphone audio while a flag is set."""

    def __init__(self, sample_rate):
        self.sample_rate = sample_rate
        self._q = queue.Queue()
        self._stream = None
        self._recording = False

    def _callback(self, indata, frames, time_info, status):
        if status:
            # Overflows etc. are non-fatal; just note them.
            print(f"[audio] {status}", file=sys.stderr)
        if self._recording:
            self._q.put(indata.copy())

    def start_stream(self):
        self._stream = sd.InputStream(
            samplerate=self.sample_rate,
            channels=1,
            dtype="float32",
            callback=self._callback,
        )
        self._stream.start()

    def begin(self):
        # Flush anything buffered from before the key press.
        while not self._q.empty():
            try:
                self._q.get_nowait()
            except queue.Empty:
                break
        self._recording = True

    def end(self):
        self._recording = False
        chunks = []
        while not self._q.empty():
            try:
                chunks.append(self._q.get_nowait())
            except queue.Empty:
                break
        if not chunks:
            return np.zeros(0, dtype=np.float32)
        return np.concatenate(chunks, axis=0).flatten()

    def close(self):
        if self._stream is not None:
            self._stream.stop()
            self._stream.close()
            self._stream = None


def inject_text(text, cfg):
    """Put transcribed text into the focused application."""
    if not text:
        return
    if cfg["trailing_space"]:
        text = text + " "

    if cfg["inject_mode"] == "paste":
        try:
            import ctypes  # noqa: F401  (import kept local; clipboard below)
            _set_clipboard(text)
            keyboard.send("ctrl+v")
            return
        except Exception as exc:
            print(f"[inject] paste failed ({exc}); falling back to typing.")

    # Default: simulate real keystrokes. Works in essentially every app and
    # across RDP because it is the same input path a physical keyboard uses.
    keyboard.write(text, delay=0.0)


def _set_clipboard(text):
    """Minimal Win32 clipboard setter (avoids extra dependencies)."""
    import ctypes
    from ctypes import wintypes

    CF_UNICODETEXT = 13
    GMEM_MOVEABLE = 0x0002

    user32 = ctypes.windll.user32
    kernel32 = ctypes.windll.kernel32

    if not user32.OpenClipboard(0):
        raise OSError("OpenClipboard failed")
    try:
        user32.EmptyClipboard()
        data = text.encode("utf-16-le") + b"\x00\x00"
        handle = kernel32.GlobalAlloc(GMEM_MOVEABLE, len(data))
        if not handle:
            raise OSError("GlobalAlloc failed")
        ptr = kernel32.GlobalLock(handle)
        ctypes.memmove(ptr, data, len(data))
        kernel32.GlobalUnlock(handle)
        if not user32.SetClipboardData(CF_UNICODETEXT, handle):
            raise OSError("SetClipboardData failed")
    finally:
        user32.CloseClipboard()


def beep(up):
    """Tiny audio cue. up=True on start, False on stop."""
    try:
        import winsound
        winsound.Beep(880 if up else 440, 90)
    except Exception:
        pass  # non-Windows or no sound device; silently skip


class Echofy:
    def __init__(self, cfg):
        self.cfg = cfg
        self.transcriber = Transcriber(cfg)
        self.recorder = Recorder(cfg["sample_rate"])
        self._busy = threading.Lock()
        self._active = False

    def _on_press(self):
        if self._active:
            return
        self._active = True
        if self.cfg["beep"]:
            beep(True)
        print("[rec] listening...")
        self.recorder.begin()

    def _on_release(self):
        if not self._active:
            return
        self._active = False
        if self.cfg["beep"]:
            beep(False)
        audio = self.recorder.end()
        # Transcribe off the hotkey thread so the key handler stays snappy.
        threading.Thread(target=self._finish, args=(audio,), daemon=True).start()

    def _finish(self, audio):
        # One dictation at a time; drop overlap rather than interleaving text.
        if not self._busy.acquire(blocking=False):
            print("[rec] still transcribing previous clip; skipped.")
            return
        try:
            secs = len(audio) / self.cfg["sample_rate"] if len(audio) else 0
            if secs < 0.3:
                print("[rec] too short, ignored.")
                return
            print(f"[rec] transcribing {secs:.1f}s...")
            t0 = time.time()
            text = self.transcriber.transcribe(audio)
            print(f"[rec] '{text}'  ({time.time() - t0:.1f}s)")
            if text:
                inject_text(text, self.cfg)
        except Exception as exc:
            print(f"[error] transcription failed: {exc}")
        finally:
            self._busy.release()

    def run(self):
        hotkey = self.cfg["hotkey"]
        print("=" * 60)
        print("  Echofy - local voice dictation")
        print(f"  Hold [{hotkey}] to dictate, release to type it out.")
        print(f"  Model: {self.cfg['model']}   Inject: {self.cfg['inject_mode']}")
        print("  Press Ctrl+C here to quit.")
        print("=" * 60)

        self.recorder.start_stream()
        # Warm the model in the background so the first dictation isn't slow.
        threading.Thread(target=self.transcriber.load, daemon=True).start()

        # keyboard needs separate press/release handlers for a held hotkey.
        keyboard.on_press_key(_last_key(hotkey), lambda e: self._on_press(),
                              suppress=False)
        keyboard.on_release_key(_last_key(hotkey), lambda e: self._on_release(),
                                suppress=False)

        try:
            keyboard.wait()  # blocks until the process is killed
        except KeyboardInterrupt:
            pass
        finally:
            self.recorder.close()
            print("\n[bye] Echofy stopped.")


def _last_key(hotkey):
    """on_press_key wants a single key name; take the last part of a combo."""
    return hotkey.split("+")[-1].strip()


def main():
    cfg = config.load_config()
    Echofy(cfg).run()


if __name__ == "__main__":
    main()
