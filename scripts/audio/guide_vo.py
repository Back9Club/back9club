"""Generate the GUIDE voiceover clips with the local MBROLA "en1" British voice.

This is a placeholder for timing only. Natural neural voices could not be
reached from the build sandbox (huggingface.co, api.elevenlabs.io and
api.openai.com are blocked by its network policy). Replace the files in
public/audio/vo/ with a real recording (same file names, WAV) and rerun
scripts/audio/build_audio.py: everything else is keyed to the timeline.

Needs: apt install espeak-ng mbrola mbrola-en1 sox
"""

import json
import pathlib
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
TIMELINE = json.loads((ROOT / "src/teaser/timeline.json").read_text())
OUT = ROOT / "public/audio/vo"

# Slow, low and level: an authoritative read rather than a bright one.
RATE_WPM = "128"
PITCH = "22"

# Studio-style polish: deepen slightly, warm low end, presence lift, steady
# compression, a touch of grit.
SOX_CHAIN = [
    # Trim leading / trailing silence so clip starts are the first syllable.
    "silence", "1", "0.01", "-42d", "reverse", "silence", "1", "0.01", "-42d", "reverse",
    "highpass", "70",
    "pitch", "-120",
    "equalizer", "140", "1q", "+3",
    "equalizer", "2800", "1.2q", "+2.5",
    "compand", "0.005,0.12", "6:-60,-60,-30,-16,-12,-8,0,-4", "-3", "-60", "0.01",
    "overdrive", "2", "8",
    "rate", "-v", "48000",
    "gain", "-n", "-1",
]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for line in TIMELINE["vo"]:
        with tempfile.TemporaryDirectory() as tmp:
            raw = pathlib.Path(tmp) / "raw.wav"
            subprocess.run(
                ["espeak-ng", "-v", "mb-en1", "-s", RATE_WPM, "-p", PITCH, "-w", str(raw), line["text"]],
                check=True,
            )
            dest = OUT / f"{line['id']}.wav"
            subprocess.run(["sox", str(raw), "-b", "24", str(dest), *SOX_CHAIN], check=True)
            print(f"{dest.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
