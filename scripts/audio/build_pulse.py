"""PULSE: compose an original 128 BPM track, then analyse it so the video can react.

1. Synthesises the track (8 bars = exactly 15 s): intro, build, drop, outro.
2. Analyses the master per video frame: 48 log-spaced spectrum bands, bass /
   mid / high envelopes, loudness, a running "energy clock", and the raw
   waveform for the finale's oscilloscope.

Outputs:
  public/audio/pulse/mix.wav     the track (48 kHz / 24-bit, -14 LUFS)
  src/pulse/analysis.json        per-frame analysis the scenes read

Usage: python3 scripts/audio/build_pulse.py
"""

import json
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import build_audio as ba  # noqa: E402  (shared DSP, instruments, mastering)

ROOT = pathlib.Path(__file__).resolve().parents[2]
TL = json.loads((ROOT / "src/pulse/timeline.json").read_text())
CUE = TL["cues"]
FPS = TL["fps"]
FRAMES = TL["durationInFrames"]
SR = ba.SR
DUR = FRAMES / FPS
N = int(round(DUR * SR))
BEAT = 60 / TL["bpm"]  # 0.46875 s
BAR = 4 * BEAT  # 1.875 s -> 8 bars = 15 s
BUILD, DROP, OUTRO = TL["sections"][1:4]


def midi(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


NOTES = {
    "F2": 41, "G2": 43, "A2": 45, "B2": 47, "C3": 48, "D3": 50, "E3": 52,
    "F3": 53, "G3": 55, "A3": 57, "B3": 59, "C4": 60, "D4": 62, "E4": 64,
    "F4": 65, "G4": 67, "A4": 69, "B4": 71, "C5": 72, "D5": 74, "E5": 76,
    "F5": 77, "G5": 79, "A5": 81,
}
ba.HZ.update({k: midi(v) for k, v in NOTES.items()})
HZ = ba.HZ

# i - VI - III - VII, twice, resolving home on the last bar.
BARS = [
    ("A2", ["A3", "C4", "E4"]),
    ("F2", ["F3", "A3", "C4"]),
    ("C3", ["C4", "E4", "G4"]),
    ("G2", ["G3", "B3", "D4"]),
    ("A2", ["A3", "C4", "E4"]),
    ("F2", ["F3", "A3", "C4"]),
    ("G2", ["G3", "B3", "D4"]),
    ("A2", ["A3", "C4", "E4", "A4"]),
]
# Lead motif over the drop (bars 5-6), in 8th notes (None = rest).
LEAD = ["E5", None, "D5", "C5", None, "A4", "C5", "D5", "C5", None, "A4", "F4", None, "A4", "C5", "E5"]


def bar_of(t):
    return BARS[max(0, min(int(t // BAR), len(BARS) - 1))]


def bright_pluck(freq, dur=0.3, cutoff=2400.0):
    t = ba.t_of(dur)
    x = 0.55 * ba.saw(freq, t) + 0.45 * ba.saw(freq * 1.004, t, 0.31)
    x = ba.sweep(x, cutoff * 2.5, cutoff * 0.35, "low", curve=np.clip(t / 0.2, 0, 1))
    return x * ba.env_exp(dur, 0.13, 0.002)


def echo(bus, clip, at, gain_db, taps=3, spacing=0.75 * BEAT, feedback=-7):
    """Ping-pong dotted-8th delay."""
    for k in range(taps + 1):
        side = 0 if k == 0 else (0.7 if k % 2 else -0.7)
        ba.place(bus, ba.pan(clip, side), at + k * spacing, gain_db + k * feedback)


def build_track():
    t = np.arange(N) / SR
    music = np.zeros((2, N))
    drums = np.zeros((2, N))

    # Pad: detuned saws following the bars, filter opening into the drop.
    chords = [(max(0.0, k * BAR - 0.02), (k + 1) * BAR + 0.02, notes) for k, (_, notes) in enumerate(BARS)]
    cutoff = 380 + ba.ramp(t, 0, BUILD, 0, 300) + ba.ramp(t, BUILD, DROP - 0.1, 0, 1800) + ba.ramp(t, DROP, DROP + 0.4, 0, 1600) - ba.ramp(t, OUTRO, DUR, 0, 3400)
    pad = ba.pad_layer(chords, t, np.clip(cutoff, 160, 8000))
    pad_level = ba.ramp(t, 0, 1.2, 0, 0.26) + ba.ramp(t, DROP, DROP + 0.2, 0, 0.06)
    pad = pad * np.clip(pad_level, 0, 1) * ba.ramp(t, 14.2, 15.0, 1, 0)
    music += ba.reverb(np.stack([pad, np.roll(pad, ba.n_of(0.012))]), ba.HALL, -8)

    # Arp: 16ths through the chord tones over two octaves, with ping-pong delay.
    sixteenths = int(DUR / (BEAT / 4))
    for k in range(sixteenths):
        at = k * BEAT / 4
        if at >= 14.4:
            break
        _, notes = bar_of(at)
        tones = notes + [n[:-1] + str(int(n[-1]) + 1) for n in notes]
        order = [0, 2, 1, 3, 2, 4, 3, 5]
        note = tones[order[k % len(order)] % len(tones)]
        if note not in HZ:
            continue
        section_gain = -21 if at < BUILD else (-20 if at < DROP else (-21 if at < OUTRO else -23))
        cut = 1400 if at < BUILD else (1400 + 2200 * (at - BUILD) / (DROP - BUILD) if at < DROP else (3600 if at < OUTRO else 2000))
        echo(music, bright_pluck(HZ[note], 0.28, cut), at, section_gain, taps=2)

    # Bass: sustained roots in the build, driving off-beat 8ths in the drop.
    for k in range(8):
        root, _ = BARS[k]
        start = k * BAR
        if BUILD <= start < DROP:
            x = ba.lp(ba.saw(HZ[root], ba.t_of(BAR)), 300) * ba.env_exp(BAR, 2.0, 0.02)
            ba.place(music, x, start, -14)
        elif DROP <= start < OUTRO:
            for e in range(8):
                ba.place(music, ba.pluck(HZ[root], dur=0.22, cutoff=900), start + (e + 0.5) * BEAT / 2, -8)
        elif start >= OUTRO:
            x = ba.lp(ba.saw(HZ[root], ba.t_of(BAR)), 220) * ba.env_exp(BAR, 1.2, 0.02)
            ba.place(music, x, start, -16)

    # Lead motif over the drop.
    for i, note in enumerate(LEAD):
        if note:
            x = bright_pluck(HZ[note], 0.42, 3200) + 0.4 * ba.bell(HZ[note], 0.42, index=1.2, decay=0.25)
            echo(music, x, DROP + i * BEAT / 2, -13, taps=3)

    # Drums.
    kicks = [DROP + b * BEAT for b in range(8)] + [OUTRO, OUTRO + 2 * BEAT]
    for b in kicks:
        ba.place(drums, ba.kick(f0=150, f1=46, decay=0.42), b, -3)
    for b in range(int(BUILD / BEAT), int(OUTRO / BEAT)):
        at = b * BEAT
        in_drop = at >= DROP
        if at >= DROP - BEAT * 1.0 and not in_drop:
            continue  # the roll owns the last beat of the build
        for s, g in ((0.5, -15), (0.25, -22), (0.75, -22)):
            if s != 0.5 and not in_drop:
                continue
            ba.place(drums, ba.pan(ba.hat(open_=(in_drop and s == 0.5), seed=2000 + 4 * b + int(s * 4)), 0.3 if s == 0.5 else -0.3), at + s * BEAT, g)
        if b % 2 == 1 and at >= BUILD + BAR:  # claps from bar 4
            ba.place(drums, ba.clap(seed=2100 + b), at, -9 if in_drop else -15)
    ba.snare_roll(CUE["riser"], DROP - 0.06, drums)

    # Sidechain pump: music ducks under every kick (what makes the drop breathe).
    pump = np.ones(N)
    for b in kicks:
        i = ba.n_of(b)
        n = min(ba.n_of(0.4), N - i)
        pump[i : i + n] = np.minimum(pump[i : i + n], 1 - 0.55 * np.exp(-np.arange(n) / SR / 0.11))
    music *= pump

    # Sound design.
    fx = np.zeros((2, N))
    ba.place(fx, ba.sfx_riser(DROP - 0.08 - CUE["riser"], seed=2200, f0=300, f1=9000, tone_from=220), CUE["riser"], -7)
    ba.place(fx, ba.sfx_impact(size=1.2, seed=2201, f0=110, f1=32, tail=1.3), DROP, -2)
    ba.place(fx, ba.sfx_reverse_swell(0.9, seed=2202), OUTRO - 0.9, -12)
    ba.place(fx, ba.sfx_shimmer(1.6, seed=2203), CUE["finalChord"], -12)
    ba.place(fx, ba.sfx_whoosh(0.9, 200, 3500, seed=2204), BUILD - 0.45, -14)
    # A beat of air before the drop.
    gap = (t > DROP - 0.06) & (t < DROP)
    music[:, gap] *= 0.1
    drums[:, gap] *= 0.1

    return music * 10 ** (-1 / 20), drums, fx


def analyse(mix, drums):
    """Per-frame analysis for the visuals."""
    mono = mix.mean(axis=0)
    hop = SR // FPS
    win = 4096
    window = np.hanning(win)
    padded = np.pad(mono, (win, win))
    freqs = np.fft.rfftfreq(win, 1 / SR)
    edges = np.geomspace(35, 16000, 49)
    raw = np.zeros((FRAMES, 48))
    rms = np.zeros(FRAMES)
    for f in range(FRAMES):
        c = win + f * hop + hop // 2
        seg = padded[c - win // 2 : c + win // 2]
        mag = np.abs(np.fft.rfft(seg * window)) ** 2
        for b in range(48):
            sel = (freqs >= edges[b]) & (freqs < edges[b + 1])
            raw[f, b] = mag[sel].mean() if sel.any() else 0
        rms[f] = np.sqrt(np.mean(seg[win // 2 - hop : win // 2 + hop] ** 2))

    db = 10 * np.log10(raw + 1e-12)
    lo = np.percentile(db, 8, axis=0)
    hi = np.percentile(db, 99.5, axis=0)
    norm = np.clip((db - lo) / np.maximum(hi - lo, 1e-6), 0, 1) ** 1.3

    # Fast attack, slower release: reads as "hitting" then decaying on screen.
    smooth = np.zeros_like(norm)
    prev = np.zeros(48)
    for f in range(FRAMES):
        cur = norm[f]
        prev = np.where(cur > prev, prev + (cur - prev) * 0.75, prev + (cur - prev) * 0.28)
        smooth[f] = prev

    level = np.clip(rms / np.percentile(rms, 99), 0, 1)
    bass = smooth[:, 0:8].mean(axis=1)
    mid = smooth[:, 16:32].mean(axis=1)
    high = smooth[:, 36:48].mean(axis=1)
    energy = np.cumsum(0.25 + level) / FPS  # a clock that runs faster when loud

    # Kick envelope from the drum bus alone (below 120 Hz): clean, sharp pulses.
    low = ba.lp(drums.mean(axis=0), 120, 4)
    kick_raw = np.array([np.sqrt(np.mean(low[f * hop : (f + 1) * hop] ** 2)) for f in range(FRAMES)])
    kick_raw = np.clip(kick_raw / (kick_raw.max() + 1e-12), 0, 1)
    kick = np.zeros(FRAMES)
    for f in range(FRAMES):
        kick[f] = max(kick_raw[f], (kick[f - 1] if f else 0) * 0.62)

    # Oscilloscope frames for the finale: 160 points around each frame.
    start = int(OUTRO * FPS) - 15
    wave = []
    ref = None
    segs = []
    for f in range(start, FRAMES):
        c = win + f * hop + hop // 2
        seg = padded[c - 1200 : c + 1200]
        segs.append(seg.reshape(160, 15).mean(axis=1))
    ref = max(np.max(np.abs(s)) for s in segs)
    wave = [np.round(s / ref, 3).tolist() for s in segs]

    r3 = lambda a: np.round(a, 3).tolist()  # noqa: E731
    return {
        "fps": FPS,
        "frames": FRAMES,
        "bands": [r3(row) for row in smooth],
        "bass": r3(bass),
        "mid": r3(mid),
        "high": r3(high),
        "level": r3(level),
        "energy": r3(energy),
        "kick": r3(kick),
        "waveStart": start,
        "wave": wave,
    }


def main():
    print("Composing PULSE...")
    music, drums, fx = build_track()
    mix = music + drums + fx
    gain = 10 ** ((ba.TARGET_LUFS - ba.lufs(mix)) / 20)
    mix = ba.fades(mix * gain, fade_in=0.02, fade_out=0.45)
    limit = ba.limiter_gain(mix)
    mix = mix * limit
    drums = drums * gain * limit
    ba.write(ROOT / "public/audio/pulse/mix.wav", mix)
    peak = 20 * np.log10(np.max(np.abs(mix)) + 1e-12)
    print(f"Master: {ba.lufs(mix):.1f} LUFS, sample peak {peak:.2f} dBFS, {mix.shape[1] / SR:.3f} s")

    print("Analysing...")
    data = analyse(mix, drums)
    out = ROOT / "src/pulse/analysis.json"
    out.write_text(json.dumps(data, separators=(",", ":")))
    print(f"  {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
