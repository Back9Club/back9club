"""Soundtrack for THE BACK 9 CLUB advert: original score and sound design.

Everything is synthesised (no samples, no stock audio, nothing licensed) with
the shared instruments in scripts/audio/build_audio.py, and placed on the cue
sheet in src/advert/timeline.json. The groove runs at 100 BPM from the strike
(3.0 s): every word slam sits on a beat, an 8th or a 16th, the 2027 reels
ratchet on the same curve as the visual, and the logo impact is on a beat.

Outputs (48 kHz / 24-bit): public/audio/advert/{music,sfx,mix}.wav
Usage: python3 scripts/advert/build_audio.py
"""

import json
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "audio"))
import build_audio as ba  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[2]
TL = json.loads((ROOT / "src/advert/timeline.json").read_text())
C = TL["cues"]
SR = ba.SR
DUR = TL["durationInFrames"] / TL["fps"]  # 18 s
N = int(round(DUR * SR))
BEAT = 60 / TL["bpm"]  # 0.6 s
BAR = 4 * BEAT
GRID0 = C["strike"]
BREATH = C["accessOut"]  # music drops out here until the logo
ROLL = TL["yearRoll"]
OUT = ROOT / "public/audio/advert"


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


NOTES = {
    "E1": 28, "E2": 40, "G2": 43, "A2": 45, "B2": 47, "C2": 36, "C3": 48, "D2": 38,
    "D3": 50, "E3": 52, "F#3": 54, "G3": 55, "A3": 57, "B3": 59, "C4": 60, "D4": 62,
    "E4": 64, "F#4": 66, "G4": 67, "A4": 69, "B4": 71, "D5": 74, "E5": 76, "B5": 83,
}
ba.HZ.update({k: midi(v) for k, v in NOTES.items()})
HZ = ba.HZ

# One chord per bar from the strike: i - VI - III - VII.
BARS = [
    ("E2", ["E3", "G3", "B3", "D4"]),
    ("C2", ["C3", "E3", "G3", "B3"]),
    ("G2", ["G3", "B3", "D4", "F#4"]),
    ("D2", ["D3", "F#3", "A3", "C4"]),
    ("E2", ["E3", "G3", "B3", "D4"]),
]


def bar_at(t):
    k = int((t - GRID0) // BAR)
    return BARS[max(0, min(k, len(BARS) - 1))]


def heartbeat(at, gain_db):
    """Low 'lub-dub' pulse."""
    for off, g in ((0.0, 0), (0.17, -4)):
        ba.place(bus_music, ba.kick(f0=70, f1=38, decay=0.3, click=0.0), at + off, gain_db + g)


def neon_buzz(start, keys, vals):
    """Mains hum and crackle gated by the neon flicker curve (same keyframes as the visual)."""
    dur = keys[-1] + 0.5
    t = ba.t_of(dur)
    gate = np.interp(t, keys, vals)
    gate[t > keys[-1]] = np.exp(-(t[t > keys[-1]] - keys[-1]) / 0.25)
    hum = sum(np.sin(2 * np.pi * 100 * h * t) / h for h in (1, 2, 3, 5)) * 0.6
    hum += ba.bp(ba.noise(dur, 801), 2000, 7000) * 0.2
    x = hum * gate
    clicks = np.abs(np.diff(gate, prepend=0)) > 0.2
    for i in np.nonzero(clicks)[0]:
        n = min(ba.n_of(0.01), len(x) - i)
        x[i : i + n] += ba.hp(ba.noise(0.01, 802 + i % 7), 3000)[:n] * 0.8
    ba.place(bus_sfx, ba.reverb(x, ba.ROOM, -10), start, -14)


def metal(notes, dur=2.4, decay=1.0):
    """Muted metallic accent, in key."""
    x = sum(ba.bell(HZ[n], dur, index=1.6, decay=decay) for n in notes) / len(notes) ** 0.5
    return ba.reverb(ba.lp(x, 7000), ba.HALL, -8)


def final_impact():
    hit = ba.sfx_impact(size=1.35, seed=870, f0=105, f1=29, tail=2.0)
    ring = metal(["E4", "B4", "E5"], dur=3.0, decay=1.4)
    n = max(hit.shape[1], ring.shape[1])
    hit = np.pad(hit, ((0, 0), (0, n - hit.shape[1])))
    ring = np.pad(ring, ((0, 0), (0, n - ring.shape[1])))
    return ba.norm(hit + ring * 0.45, 0.95)


def slam(at, weight=1.0, seed=0):
    """A word slamming in: a whip of air into a thud and a bright snap."""
    ba.place(bus_sfx, ba.sfx_whoosh(0.14, 1500, 7000, seed=900 + seed, pan_from=-0.2, pan_to=0.2), at - 0.12, -22 + 4 * weight)
    ba.place(bus_sfx, ba.tom(100 - 14 * weight, seed=880 + seed), at, -15 + 5 * weight)
    ba.place(bus_sfx, ba.sfx_tick(2600 + 500 * (1 - weight), seed=890 + seed), at, -17 + 3 * weight)


def lock_at(i):
    """When digit i of 2027 locks (same as lockAt in OpeningYear.tsx)."""
    return C["yearLand"] - (3 - i) * ROLL["lockStep"]


def reel_ticks(i):
    """Times at which digit i's reel passes a cell, on the same curve as the
    visual: constant spin, then a deceleration over the last few cells."""
    n, d, a = ROLL["decelCells"], ROLL["decel"], ROLL["endSpeed"]
    lock = lock_at(i)
    v = n * (2 - a) / d
    spin = [lock - d - (c - n) / v for c in range(n + 1, 200)]
    spin = [x for x in spin if x >= C["spin"]]
    decel = [lock - d * (-a + np.sqrt(a * a + 4 * (1 - a) * c / n)) / (2 * (1 - a)) for c in range(n, 0, -1)]
    return spin, decel


bus_music = np.zeros((2, N))
bus_sfx = np.zeros((2, N))


def build():
    t = np.arange(N) / SR

    # --- Atmosphere: sub drone and air, from the first frame -----------------
    drone = np.sin(2 * np.pi * HZ["E1"] * t) * 0.75 + np.sin(2 * np.pi * HZ["E2"] * t + 0.4) * 0.3
    drone *= 0.85 + 0.15 * np.sin(2 * np.pi * 0.21 * t)
    level = ba.ramp(t, 0, 1.2, 0, 0.3) + ba.ramp(t, GRID0, GRID0 + 1, 0, 0.3) - ba.ramp(t, BREATH, BREATH + 0.3, 0, 0.2) + ba.ramp(t, C["logoOn"], C["logoOn"] + 0.2, 0, 0.2) - ba.ramp(t, 17.0, 18.0, 0, 0.75)
    bus_music[:] += ba.stereo(drone * np.clip(level, 0, 1))
    air = ba.lp(ba.noise(DUR, 810), 900, 1) * 0.25 + ba.lp(ba.noise(DUR, 811), 120, 2) * 1.2
    bus_music[:] += ba.pan(air * np.clip(ba.ramp(t, 0, 1.0, 0, 0.18) - ba.ramp(t, GRID0, GRID0 + 0.5, 0, 0.1) - ba.ramp(t, 17.2, 18.0, 0, 0.1), 0, 1), 0)

    # Heartbeat pulses, quickening into the strike.
    for at, g in ((0.55, -14), (1.45, -12), (2.2, -10), (2.7, -9)):
        heartbeat(at, g)

    # --- Pad: chords from the strike, a held breath, then the final chord ---
    chords = [(GRID0 + k * BAR - 0.02, GRID0 + (k + 1) * BAR + 0.02, notes) for k, (_, notes) in enumerate(BARS)]
    chords = [(a, min(b, BREATH + 0.4), n) for a, b, n in chords if a < BREATH]
    chords.insert(0, (0.4, GRID0 + 0.02, ["E3", "B3", "F#4"]))
    chords.append((BREATH + 0.3, C["logoOn"] + 0.02, ["E3", "B3", "E4"]))
    chords.append((C["logoOn"] - 0.02, DUR, ["E3", "G3", "B3", "F#4"]))
    cutoff = 280 + ba.ramp(t, 0.4, 3.0, 0, 250) + ba.ramp(t, GRID0, BREATH - 0.2, 0, 2200) - ba.ramp(t, BREATH, BREATH + 0.4, 0, 2100) + ba.ramp(t, C["logoOn"], C["logoOn"] + 0.6, 0, 1400) - ba.ramp(t, 16.5, 18.0, 0, 1300)
    pad = ba.pad_layer(chords, t, np.clip(cutoff, 150, 7000))
    pad_level = ba.ramp(t, 0.4, 2.8, 0, 0.1) + ba.ramp(t, GRID0, GRID0 + 0.6, 0, 0.14) - ba.ramp(t, C["logoOn"] - 0.1, C["logoOn"] + 0.6, 0, 0.08)
    pad = pad * np.clip(pad_level, 0, 1) * ba.ramp(t, 17.0, 18.0, 1, 0)
    bus_music[:] += ba.reverb(np.stack([pad, np.roll(pad, ba.n_of(0.012))]), ba.HALL, -8)

    # --- Groove: from the first word to the breath ----------------------------
    beats = np.arange(C["taking"], BREATH - 0.01, BEAT)
    for k, b in enumerate(beats):
        root, notes = bar_at(b)
        section = 0 if b < C["opening"] - 0.3 else (1 if b < C["memberships"] - 0.3 else 2)
        ba.place(bus_music, ba.kick(f0=125, decay=0.4), b, -6)
        if k % 2 == 1 and section >= 1:
            ba.place(bus_music, ba.clap(seed=900 + k), b, -12)
        steps = (0.5,) if section == 0 else ((0.5, 0.25, 0.75) if section == 2 else (0.5,))
        for s in steps:
            ba.place(bus_music, ba.pan(ba.hat(seed=950 + 4 * k + int(s * 4)), 0.3 if s == 0.5 else -0.3), b + s * BEAT, -17 if s == 0.5 else -23)
        for s, octave in ((0, 1), (0.5, 2)):
            ba.place(bus_music, ba.pan(ba.pluck(HZ[root] * octave, cutoff=600 + 450 * section, seed=k), -0.05), b + s * BEAT, -10 - (3 if octave == 2 else 0))
        if section == 2:
            for s in range(4):
                note = notes[(k * 4 + s) % len(notes)]
                ba.place(bus_music, ba.pan(ba.bell(HZ[note] * 2, 0.35, index=1.3, decay=0.15), 0.5 if s % 2 else -0.5), b + s * BEAT / 4, -22)
    # A short fill into the breath.
    ba.snare_roll(BREATH - BEAT, BREATH - 0.05, bus_music)

    # --- Sound design -----------------------------------------------------------
    s = bus_sfx
    # Light: a glassy swell as the rim lights come up, an airy sweep with the key light.
    ba.place(s, ba.sfx_reverse_swell(1.1, seed=820), C["rimIn"] + 0.1, -16)
    ba.place(s, ba.sfx_shimmer(1.8, seed=821), C["keyIn"], -18)
    ba.place(s, ba.sfx_tick(3600, seed=822), C["kicker"], -18)
    # The kicker's letters rippling in: a faint run of clicks.
    for i, ch in enumerate("Indoor golf • Hastings"):
        if ch != " ":
            ba.place(s, ba.pan(ba.sfx_tick(5200 + 40 * i, seed=700 + i), -0.4 + 0.04 * i), C["kicker"] + 0.03 + i * 0.022, -30)
    # The strike: riser, swing, contact, impact, the ball flying off.
    ba.place(s, ba.sfx_riser(C["swing"] - 2.1 + 0.15, seed=823, f0=300, f1=6000, tone_from=110), 2.1, -12)
    ba.place(s, ba.sfx_whoosh(0.32, 400, 6000, seed=824, pan_from=-0.8, pan_to=0.1), C["swing"] - 0.12, -4)
    ba.place(s, ba.sfx_ball_strike(seed=825), C["strike"] - 0.005, 0)
    ba.place(s, ba.sfx_impact(size=1.3, seed=826, f0=105, f1=30, tail=1.5), C["strike"], -1)
    ba.place(s, ba.sfx_ball_flight(0.6, seed=827, pan_from=0.0, pan_to=0.9), C["strike"] + 0.02, -6)
    ba.place(s, ba.sfx_reverse_swell(0.5, seed=828), C["taking"] - 0.5, -14)
    # Statement: a hit per line, metal on HASTINGS.
    for cue, size in (("taking", 0.9), ("hastings", 1.0), ("scene", 0.9)):
        ba.place(s, ba.tom(88 if cue != "hastings" else 76, seed=830), C[cue], -9)
        ba.place(s, ba.sfx_impact(size=size, seed=831 + int(size * 10), f0=90, f1=38, tail=0.8), C[cue], -9)
    for k, cue in enumerate(("over", "the", "golf")):
        slam(C[cue], 0.4, seed=k)
    ba.place(s, metal(["E4", "B4", "D5"]), C["hastings"], -16)
    ba.place(s, ba.sfx_whoosh(0.35, 300, 5000, seed=833, pan_from=0.2, pan_to=-0.2), C["statementOut"] - 0.12, -9)
    # 2027: word slams, the reels' ratchet, a clunk per locked digit, the landing.
    slam(C["opening"], 0.6, seed=4)
    slam(C["early"], 0.6, seed=5)
    for i in range(4):
        spin, decel = reel_ticks(i)
        p = -0.45 + 0.3 * i
        for j, at in enumerate(spin):
            ba.place(s, ba.pan(ba.sfx_tick(4600 + 150 * i, seed=1000 + 40 * i + j % 7), p), at, -29)
        for j, at in enumerate(decel):
            ba.place(s, ba.pan(ba.sfx_tick(3800 + 150 * i, seed=1020 + 40 * i + j), p), at, -23)
        if i < 3:
            ba.place(s, ba.tom(125, seed=1060 + i), lock_at(i), -14)
            ba.place(s, ba.pan(ba.sfx_tick(2400, seed=1070 + i), p), lock_at(i), -15)
    ba.place(s, ba.sfx_impact(size=1.15, seed=846, f0=85, f1=28, tail=1.4), C["yearLand"], -2)
    ba.place(s, metal(["G3", "B4", "D5"]), C["yearLand"], -14)
    ba.place(s, ba.sfx_whoosh(0.6, 200, 3500, seed=847), C["openingOut"] - 0.2, -8)
    # Access: panels sweep in from opposite sides.
    ba.place(s, ba.sfx_whoosh(0.5, 500, 5500, seed=850, pan_from=-0.8, pan_to=0.2), C["memberships"] - 0.3, -8)
    slam(C["memberships"], 0.6, seed=6)
    ba.place(s, ba.sfx_tick(4200, seed=852), C["amp"], -15)
    ba.place(s, ba.tom(150, seed=856), C["amp"], -19)
    ba.place(s, ba.sfx_whoosh(0.5, 500, 5500, seed=853, pan_from=0.8, pan_to=-0.2), C["walkIns"] - 0.3, -8)
    slam(C["walkIns"], 0.6, seed=7)
    ba.place(s, ba.sfx_low_sweep(1.0, f0=120, f1=40, seed=855), BREATH, -10)
    # Logo: neon buzz with the flicker, the biggest hit, light sweeps, the CTA.
    neon_buzz(C["neon"], [0, 0.04, 0.08, 0.12, 0.16, 0.22, 0.27, 0.32, 0.4], [0, 0.85, 0.1, 0.95, 0.25, 1, 0.6, 1, 1])
    ba.place(s, ba.sfx_reverse_swell(0.9, seed=860), C["logoOn"] - 0.9, -10)
    ba.place(s, final_impact(), C["logoOn"], 0)
    ba.place(s, ba.sfx_shimmer(1.2, seed=861), C["sweep"], -12)
    for k, (cue, weight) in enumerate((("watch", 0.4), ("this", 0.4), ("space", 0.75))):
        slam(C[cue], weight, seed=8 + k)
    ba.place(s, ba.sfx_tick(4200, seed=866), C["footer"], -19)
    ba.place(s, ba.sfx_impact(size=0.6, seed=867, f0=80, f1=40, tail=1.2), C["finalHit"], -10)
    ba.place(s, ba.sfx_shimmer(1.4, seed=868), C["finalHit"] - 0.1, -14)

    # The breath: music fully out between the panels leaving and the logo.
    gap = (t > BREATH + 0.05) & (t < C["logoOn"])
    bus_music[:, gap] *= np.linspace(1, 0.35, int(gap.sum()))


def main():
    print("Building advert soundtrack...")
    build()
    music = bus_music * 10 ** (-2 / 20)
    sfx = bus_sfx.copy()
    mix = music + sfx
    gain = 10 ** ((ba.TARGET_LUFS - ba.lufs(mix)) / 20)
    music, sfx = (ba.fades(x * gain, fade_in=0.03, fade_out=0.6) for x in (music, sfx))
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
