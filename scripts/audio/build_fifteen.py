"""Soundtrack for FIFTEEN: an original 160 BPM score in F minor plus sound design.

Synthesised from scratch with the instrument and mastering helpers in
build_audio.py, and placed on the cue sheet in src/fifteen/timeline.json so
every hit lands on the frame its visual does.

Outputs (48 kHz / 24-bit): public/audio/fifteen/{mix,music,sfx}.wav
Usage: python3 scripts/audio/build_fifteen.py
"""

import json
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import build_audio as ba  # noqa: E402  (shared DSP, instruments, mastering)

ROOT = pathlib.Path(__file__).resolve().parents[2]
TL = json.loads((ROOT / "src/fifteen/timeline.json").read_text())
CUE = TL["cues"]
CUTS = TL["cuts"]
SR = ba.SR
DUR = TL["durationInFrames"] / TL["fps"]  # 15.0 s
N = int(round(DUR * SR))
BEAT = 60 / TL["bpm"]  # 0.375 s
BAR = 4 * BEAT  # 1.5 s
OUT = ROOT / "public/audio/fifteen"


def midi(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


# F minor. Register the extra notes with the shared pad instrument.
NOTES = {
    "F1": 29, "Ab1": 32, "Db2": 37, "Eb2": 39, "F2": 41, "Ab2": 44, "Bb2": 46,
    "C3": 48, "Db3": 49, "Eb3": 51, "F3": 53, "G3": 55, "Ab3": 56, "Bb3": 58,
    "C4": 60, "Db4": 61, "Eb4": 63, "F4": 65, "G4": 67, "Ab4": 68, "Bb4": 70,
    "C5": 72, "Db5": 73, "Eb5": 75, "F5": 77, "Ab5": 80, "C6": 84,
}
ba.HZ.update({name: midi(m) for name, m in NOTES.items()})
HZ = ba.HZ

# One chord per bar from the first cut: i - VI - III - VII - i - VI, then i.
PROGRESSION = [
    ("F2", ["F3", "Ab3", "C4", "Eb4"]),
    ("Db2", ["Db3", "F3", "Ab3", "C4"]),
    ("Ab1", ["Ab2", "C3", "Eb3", "G3"]),
    ("Eb2", ["Eb3", "G3", "Bb3", "Db4"]),
    ("F2", ["F3", "Ab3", "C4", "Eb4"]),
    ("Db2", ["Db3", "F3", "Ab3", "C4"]),
]
GROOVE_START = CUTS[0]
FINALE = CUTS[3]


def chord_at(t: float):
    k = int((t - GROOVE_START) // BAR)
    return PROGRESSION[max(0, min(k, len(PROGRESSION) - 1))]


def blip(freq, dur=0.22, glide=1.0, decay=0.08):
    """Short pitched blip, optionally gliding (glide = end/start ratio)."""
    t = ba.t_of(dur)
    f = freq * glide ** (t / dur)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * ba.env_exp(dur, decay, 0.002)
    x += np.sin(2 * np.pi * np.cumsum(f * 2) / SR) * ba.env_exp(dur, decay * 0.5) * 0.25
    return x


def slice_hit(seed):
    dur = 0.09
    x = ba.bp(ba.noise(dur, seed), 2500, 9000) * ba.env_exp(dur, 0.012, 0.0005)
    return x + blip(1800, dur, 0.6, 0.015) * 0.4


def stab(notes, dur=2.6, decay=1.1):
    x = sum(ba.bell(HZ[n], dur, index=1.8, decay=decay) for n in notes) / len(notes) ** 0.5
    return ba.reverb(ba.lp(x, 7000), ba.HALL, -7)


# --------------------------------------------------------------------------
# Music
# --------------------------------------------------------------------------

def build_music():
    t = np.arange(N) / SR
    bus = np.zeros((2, N))

    # Sub drone on F, swelling through the intro, dipping for the finale hits.
    drone = np.sin(2 * np.pi * HZ["F1"] * t) * 0.7 + np.sin(2 * np.pi * HZ["F2"] * t + 0.3) * 0.3
    level = ba.ramp(t, 0, 1.4, 0, 0.5) - ba.ramp(t, 2.9, 3.05, 0, 0.2) + ba.ramp(t, 11.6, 12.0, 0, 0.15)
    bus += ba.stereo(drone * np.clip(level, 0, 1) * ba.ramp(t, 14.4, 15.0, 1, 0))

    # Pad: chords from the first cut, filter opening chapter by chapter.
    chords = [
        (GROOVE_START + k * BAR - 0.02, GROOVE_START + (k + 1) * BAR + 0.02, notes)
        for k, (_, notes) in enumerate(PROGRESSION)
    ]
    chords.insert(0, (0.6, GROOVE_START + 0.02, ["F3", "C4", "G4"]))
    chords.append((FINALE - 0.02, DUR, ["F3", "Ab3", "C4", "F4"]))
    cutoff = 300 + ba.ramp(t, 0.6, 3.0, 0, 300) + ba.ramp(t, 3.0, 11.9, 0, 2200) + ba.ramp(t, 12.0, 12.6, 0, 1500) - ba.ramp(t, 13.0, 15.0, 0, 2800)
    pad = ba.pad_layer(chords, t, np.clip(cutoff, 150, 7000))
    pad_level = ba.ramp(t, 0.6, 2.5, 0, 0.22) + ba.ramp(t, 3.0, 9.0, 0, 0.1) + ba.ramp(t, 12.0, 12.3, 0, 0.08)
    pad = pad * np.clip(pad_level, 0, 1) * ba.ramp(t, 14.5, 15.0, 1, 0)
    bus += ba.reverb(np.stack([pad, np.roll(pad, ba.n_of(0.013))]), ba.HALL, -9)

    beats = [GROOVE_START + k * BEAT for k in range(int((FINALE - GROOVE_START) / BEAT))]
    for k, b in enumerate(beats):
        pos = k % 4  # beat within the bar
        root, notes = chord_at(b)
        chapter = sum(b >= c for c in CUTS)  # 1..3 inside the groove

        # Kick: 1 and the "and" of 2 (half-time syncopation), plus 3 in DATA.
        if pos == 0 or (chapter >= 3 and pos == 2):
            ba.place(bus, ba.kick(f0=135, decay=0.36), b, -6)
        if pos == 1:
            ba.place(bus, ba.kick(f0=125, decay=0.25), b + BEAT / 2, -10)
        # Clap on 3.
        if pos == 2:
            ba.place(bus, ba.clap(seed=900 + k), b, -11)
        # Hats: 8ths, then 16ths from DEPTH.
        for s, g in ((0.5, -17), (0.25, -23), (0.75, -23)):
            if s != 0.5 and chapter < 2:
                continue
            ba.place(bus, ba.pan(ba.hat(seed=950 + 4 * k + int(s * 4)), 0.3 if s == 0.5 else -0.25), b + s * BEAT, g)
        # Bass: 8th-note plucks on the root, octave jump on the off-beat.
        for s, octave in ((0, 1), (0.5, 2)):
            ba.place(bus, ba.pan(ba.pluck(HZ[root] * octave, cutoff=700 + 500 * chapter, seed=k), -0.05), b + s * BEAT, -9 - (3 if octave == 2 else 0))
        # Arp (DEPTH and DATA): 16th-note bell arpeggio, ping-ponged.
        if chapter >= 2:
            for s in range(4):
                note = notes[(k * 4 + s) % len(notes)]
                x = ba.bell(HZ[note] * 2, 0.4, index=1.4, decay=0.18)
                ba.place(bus, ba.pan(x, 0.55 if s % 2 else -0.55), b + s * BEAT / 4, -20)

    # Finale: drums drop out; a single kick with each stat.
    for cue in (CUE["stat1"], CUE["stat2"]):
        ba.place(bus, ba.kick(f0=140, decay=0.5), cue, -6)
    return bus


# --------------------------------------------------------------------------
# Sound design
# --------------------------------------------------------------------------

def build_sfx():
    bus = np.zeros((2, N))
    c = CUE

    # The countdown: a clock tick on every second (alternating tick / tock).
    for s in range(1, 15):
        ba.place(bus, ba.pan(ba.sfx_tick(3800 if s % 2 else 3100, seed=s), 0.35 if s % 2 else -0.35), s, -21)

    # 01 TYPE
    for i in range(6):
        ba.place(bus, ba.pan(ba.sfx_tick(2200 + 260 * i, seed=20 + i), -0.5 + 0.2 * i), c["lettersStart"] + i * c["letterStagger"] + 0.09, -15)
    ba.place(bus, ba.sfx_whoosh(0.5, 900, 5000, seed=30, pan_from=-0.4, pan_to=0.4), c["isJust"] - 0.2, -17)
    ba.place(bus, ba.sfx_impact(size=1.0, seed=31, f0=90, f1=36, tail=1.1), c["math"], -3)
    for i in range(6):
        ba.place(bus, ba.pan(slice_hit(40 + i), 0.6 if i % 2 else -0.6), c["slice"] + i * 0.018, -10)
    # The easing curve, sonified: a tone gliding along outExpo as the dot rides it.
    u0, dur = c["math"] + 0.6, 1.1
    tt = ba.t_of(dur)
    v = 1 - 2 ** (-10 * tt / dur)
    tone = np.sin(2 * np.pi * np.cumsum(420 + 760 * v) / SR) * np.sin(np.pi * tt / dur) ** 0.5
    ba.place(bus, ba.reverb(tone, ba.ROOM, -10), u0, -24)
    ba.place(bus, ba.sfx_riser(0.6, seed=45, f0=600, f1=7000, tone_from=330), CUTS[0] - 0.62, -12)

    # Transitions: a whoosh centred on every cut.
    for k, cut in enumerate(CUTS):
        ba.place(bus, ba.sfx_whoosh(0.55, 250, 4500, seed=50 + k, pan_from=0.7 if k % 2 else -0.7, pan_to=-0.4 if k % 2 else 0.4), cut - 0.32, -8)

    # 02 FORM: tuned bloops on each morph.
    for cue_name, note in (("gridIn", "C5"), ("gridSquare", "Eb5"), ("gridDiamond", "F5"), ("gridRipple", "Ab5")):
        ba.place(bus, ba.reverb(blip(HZ[note], 0.35, 0.5, 0.09), ba.ROOM, -12), c[cue_name], -15)

    # 03 DEPTH: blocks clatter in, burst apart, snap back.
    for i in range(9):
        ba.place(bus, ba.pan(ba.sfx_tick(1400 + 90 * i, seed=60 + i), -0.6 + 0.15 * i), c["cubeIn"] + 0.05 + i * 0.035, -16)
    ba.place(bus, ba.sfx_impact(size=0.9, seed=70, f0=80, f1=34, tail=0.9), c["cubeExplode"], -5)
    ba.place(bus, stab(["F4", "C5", "Ab5"]), c["cubeExplode"], -15)
    ba.place(bus, ba.sfx_reverse_swell(0.7, seed=71), c["cubeRejoin"] - 0.7, -14)
    ba.place(bus, ba.sfx_tick(900, seed=72), c["cubeRejoin"] + 0.06, -8)
    ba.place(bus, ba.sfx_impact(size=0.5, seed=73, f0=70, f1=45, tail=0.4), c["cubeRejoin"] + 0.06, -14)

    # 04 DATA: odometer ticks slowing with the counter, rising tones per bar.
    span = c["countEnd"] - c["countStart"]
    prev = -1
    for i in range(240):
        u = i / 240
        value = int(48 * (1 - 2 ** (-10 * u)))
        if value != prev:
            ba.place(bus, ba.pan(ba.sfx_tick(4600, seed=100 + value), 0.2), c["countStart"] + u * span, -24)
            prev = value
    for i, note in enumerate(["F4", "Ab4", "Bb4", "C5", "Eb5", "F5", "Ab5"]):
        ba.place(bus, ba.pan(blip(HZ[note], 0.25, 1.0, 0.07), -0.5 + i / 6), c["barsStart"] + i * c["barStagger"] + 0.05, -16)
    line = ba.t_of(0.75)
    zip_tone = np.sin(2 * np.pi * np.cumsum(500 + 900 * (line / 0.75) ** 1.5) / SR) * np.sin(np.pi * line / 0.75)
    ba.place(bus, zip_tone, c["lineDraw"], -26)
    ba.place(bus, ba.sfx_riser(0.7, seed=110, f0=400, f1=8000, tone_from=220), CUTS[3] - 0.72, -10)

    # 05 FINALE: burst, ring pulses, three stat hits, the last one branded.
    ba.place(bus, ba.sfx_impact(size=1.2, seed=120, f0=110, f1=30, tail=1.4), c["burst"], 0)
    ba.place(bus, ba.sfx_shimmer(1.2, seed=121), c["burst"] + 0.05, -10)
    ba.place(bus, ba.sfx_impact(size=0.7, seed=122, f0=90, f1=40, tail=0.6), c["stat1"], -7)
    ba.place(bus, ba.sfx_impact(size=0.7, seed=123, f0=95, f1=40, tail=0.6), c["stat2"], -7)
    ba.place(bus, ba.sfx_impact(size=1.3, seed=124, f0=110, f1=29, tail=1.6), c["stat3"], -1)
    ba.place(bus, stab(["F3", "C4", "F4", "Ab4"], dur=2.4, decay=1.3), c["stat3"], -9)
    return bus


def main():
    print("Building FIFTEEN soundtrack...")
    music = build_music() * 10 ** (-2 / 20)
    sfx = build_sfx()
    mix = music + sfx
    gain = 10 ** ((ba.TARGET_LUFS - ba.lufs(mix)) / 20)
    music, sfx = (ba.fades(s * gain, fade_in=0.05, fade_out=0.3) for s in (music, sfx))
    limit = ba.limiter_gain(music + sfx)
    music, sfx = music * limit, sfx * limit
    ba.write(OUT / "music.wav", music)
    ba.write(OUT / "sfx.wav", sfx)
    ba.write(OUT / "mix.wav", music + sfx)
    final = music + sfx
    peak = 20 * np.log10(np.max(np.abs(final)) + 1e-12)
    print(f"Master: {ba.lufs(final):.1f} LUFS, sample peak {peak:.2f} dBFS, {final.shape[1] / SR:.3f} s")


if __name__ == "__main__":
    main()
