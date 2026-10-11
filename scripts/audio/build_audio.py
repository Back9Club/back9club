"""Build the launch teaser soundtrack: original score, sound design and mix.

Everything is synthesised here (no samples, no stock audio) and placed on the
cue sheet in src/teaser/timeline.json, so every hit lands on the frame its
visual lands on.

Outputs (48 kHz / 24-bit WAV):
  public/audio/sfx/*.wav        individual sound-design one-shots
  public/audio/stems/music.wav  score, ducked under the voiceover
  public/audio/stems/sfx.wav    sound design bus
  public/audio/stems/vo.wav     voiceover bus (from public/audio/vo/*.wav)
  public/audio/mix.wav          full master (the stems sum to exactly this)
  public/audio/mix-no-vo.wav    music + sound design only

The three stems share one limiter gain curve, so playing them together (as the
Remotion composition does) reproduces the master exactly.

Usage: python3 scripts/audio/build_audio.py
"""

import json
import pathlib
import wave

import numpy as np
from numpy.lib.stride_tricks import sliding_window_view
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt, sosfilt_zi

ROOT = pathlib.Path(__file__).resolve().parents[2]
TL = json.loads((ROOT / "src/teaser/timeline.json").read_text())
CUE = TL["cues"]
SR = 48000
DUR = TL["durationInFrames"] / TL["fps"]  # 19.5 s
N = int(round(DUR * SR))
BEAT = 60 / TL["bpm"]  # 0.5 s

TARGET_LUFS = -14.0
CEILING_DB = -1.2  # headroom for AAC encoding

# Note frequencies (D minor world).
HZ = {
    "D1": 36.71, "F1": 43.65, "A1": 55.00, "Bb1": 58.27, "C2": 65.41, "D2": 73.42,
    "E2": 82.41, "F2": 87.31, "G2": 98.00, "A2": 110.0, "Bb2": 116.54, "C3": 130.81,
    "D3": 146.83, "E3": 164.81, "F3": 174.61, "G3": 196.0, "A3": 220.0, "Bb3": 233.08,
    "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23, "A4": 440.0, "D5": 587.33,
}


# --------------------------------------------------------------------------
# DSP helpers
# --------------------------------------------------------------------------

def n_of(sec: float) -> int:
    return int(round(sec * SR))


def t_of(dur: float) -> np.ndarray:
    return np.arange(n_of(dur)) / SR


def noise(dur: float, seed: int) -> np.ndarray:
    return np.random.default_rng(seed).standard_normal(n_of(dur))


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def sweep(x, f_start, f_end, kind="low", width=0.6, block=256, curve=None):
    """Time-varying filter: cutoff (or band centre) glides log-wise f_start -> f_end.

    `curve` optionally gives the 0..1 glide position per sample.
    """
    out = np.zeros_like(x)
    zi = None
    n = len(x)
    pos = curve if curve is not None else np.linspace(0, 1, n)
    for i in range(0, n, block):
        p = float(pos[min(i + block // 2, n - 1)])
        f = f_start * (f_end / f_start) ** p
        if kind == "band":
            lo, hi = f * (1 - width / 2), min(f * (1 + width / 2), SR * 0.45)
            sos = butter(2, [max(lo, 20), hi], "band", fs=SR, output="sos")
        else:
            sos = butter(2, min(f, SR * 0.45), kind, fs=SR, output="sos")
        if zi is None:
            zi = sosfilt_zi(sos) * x[0]
        seg, zi = sosfilt(sos, x[i : i + block], zi=zi)
        out[i : i + block] = seg
    return out


def env_exp(dur, decay, attack=0.002):
    t = t_of(dur)
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t / decay)


def smoothstep(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def ramp(t, t0, t1, v0, v1):
    """Smooth automation curve over absolute time array t."""
    return v0 + (v1 - v0) * smoothstep((t - t0) / max(t1 - t0, 1e-6))


def pan(x, p):
    """Equal-power pan; p in [-1, 1] (scalar or per-sample)."""
    a = (np.asarray(p) + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)])


def stereo(x):
    return np.stack([x, x]) if x.ndim == 1 else x


def place(bus, clip, at, gain_db=0.0):
    clip = stereo(clip) * 10 ** (gain_db / 20)
    i = n_of(at)
    if i < 0:
        clip, i = clip[:, -i:], 0
    j = min(i + clip.shape[1], bus.shape[1])
    if j > i:
        bus[:, i:j] += clip[:, : j - i]


def norm(x, peak=0.9):
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 0 else x


def soft_clip(x, drive=1.5):
    return np.tanh(x * drive) / np.tanh(drive)


def make_ir(rt60, dur, seed, damp=7000.0, predelay=0.018):
    t = t_of(dur)
    env = 10 ** (-3 * t / rt60)
    chans = []
    for k in range(2):
        ch = noise(dur, seed + k) * env
        ch = lp(ch, damp, 1)
        chans.append(np.concatenate([np.zeros(n_of(predelay)), ch]))
    ir = np.stack(chans)
    return ir / np.sqrt(np.sum(ir**2) / 2)


HALL = make_ir(2.6, 3.4, 101, damp=5200)
ROOM = make_ir(0.45, 0.7, 202, damp=9000, predelay=0.008)


def reverb(x, ir, wet_db, dry=1.0):
    x = stereo(x)
    wet = np.stack([fftconvolve(x[c], ir[c])[: x.shape[1]] for c in range(2)])
    return dry * x + wet * 10 ** (wet_db / 20)


def saw(freq, t, phase=0.0):
    return 2 * ((freq * t + phase) % 1.0) - 1


# --------------------------------------------------------------------------
# Sound design one-shots
# --------------------------------------------------------------------------

def sfx_tick(freq=3400.0, seed=1):
    """Short, refined text-reveal tick."""
    dur = 0.09
    t = t_of(dur)
    tone = np.sin(2 * np.pi * freq * t) * env_exp(dur, 0.006, 0.0005)
    click = hp(noise(dur, seed), 4000) * env_exp(dur, 0.002, 0.0002) * 0.4
    body = np.sin(2 * np.pi * freq / 2 * t) * env_exp(dur, 0.012) * 0.3
    return norm(tone + click + body, 0.5)


def sfx_impact(size=1.0, seed=10, f0=90.0, f1=31.0, tail=1.6):
    """Deep cinematic impact: sub drop + boom + transient crack + hall."""
    dur = 3.2
    t = t_of(dur)
    f = f1 + (f0 - f1) * np.exp(-t / 0.09)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(dur, 0.55 * tail, 0.001)
    thump_f = 55 + 110 * np.exp(-t / 0.025)
    thump = np.sin(2 * np.pi * np.cumsum(thump_f) / SR) * env_exp(dur, 0.09, 0.0005)
    boom = lp(noise(dur, seed), 160, 2) * env_exp(dur, 0.35 * tail, 0.004) * 2.2
    crack = hp(noise(dur, seed + 1), 1800) * env_exp(dur, 0.018, 0.0003) * 0.55
    body = sub * 1.0 + thump * 0.8 + boom * 0.6 + crack * size
    body = soft_clip(body * 1.2, 1.6)
    out = reverb(body, HALL, -14 + 4 * (size - 1))
    return norm(out, 0.95)


def sfx_whoosh(dur=0.7, f0=250.0, f1=3800.0, peak=0.62, seed=20, pan_from=-0.6, pan_to=0.6):
    """Clean air whoosh: band-passed noise, swept centre, moving pan."""
    t = np.linspace(0, 1, n_of(dur))
    shape = np.where(t < peak, (t / peak) ** 2.2, ((1 - t) / (1 - peak)) ** 1.6)
    x = noise(dur, seed)
    x = sweep(x, f0, f1, "band", width=0.9, curve=smoothstep(t)) * shape
    x = x + lp(noise(dur, seed + 7), 400) * shape * 0.35
    return norm(reverb(pan(x, pan_from + (pan_to - pan_from) * smoothstep(t)), HALL, -18), 0.8)


def sfx_reverse_swell(dur=1.0, seed=30):
    """Reversed-reverb swell that sucks into a cut."""
    x = hp(noise(0.25, seed), 300) * env_exp(0.25, 0.05)
    wet = reverb(x, HALL, 0, dry=0.0)[:, : n_of(dur)]
    if wet.shape[1] < n_of(dur):
        wet = np.pad(wet, ((0, 0), (0, n_of(dur) - wet.shape[1])))
    return norm(wet[:, ::-1] * np.linspace(0.2, 1, wet.shape[1]) ** 2, 0.7)


def sfx_riser(dur=1.0, seed=40, f0=300.0, f1=6000.0, tone_from=110.0):
    """Noise + pitch riser with accelerating tremolo; cuts dead at the end."""
    t = t_of(dur)
    u = t / dur
    nz = sweep(noise(dur, seed), f0, f1, "band", width=0.8, curve=u**1.5) * u**2.2
    f = tone_from * 2 ** (2 * u**1.4)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * u**2 * 0.35
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(4 + 22 * u**2) / SR)
    x = (nz + tone) * trem
    x[-n_of(0.01) :] *= np.linspace(1, 0, n_of(0.01))
    return norm(pan(x, 0.25 * np.sin(2 * np.pi * 0.7 * t)), 0.75)


def sfx_low_sweep(dur=1.2, f0=140.0, f1=38.0, seed=50):
    """Refined low-frequency downward sweep."""
    t = t_of(dur)
    f = f1 + (f0 - f1) * np.exp(-t / (dur / 3.2))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.7
    x = x + lp(noise(dur, seed), 120) * 0.4 * np.exp(-t / 0.5)
    return norm(x, 0.8)


def sfx_ball_strike(seed=60):
    """Crisp driver-on-ball contact: inharmonic modes, very fast decay."""
    dur = 0.35
    t = t_of(dur)
    modes = [(2150, 0.012, 1.0), (3420, 0.008, 0.7), (5260, 0.005, 0.45), (1320, 0.02, 0.5)]
    x = sum(a * np.sin(2 * np.pi * f * t) * env_exp(dur, d, 0.0002) for f, d, a in modes)
    x = x + hp(noise(dur, seed), 2500) * env_exp(dur, 0.004, 0.0001) * 0.9
    x = x + np.sin(2 * np.pi * 180 * t) * env_exp(dur, 0.03) * 0.4
    return norm(reverb(x, ROOM, -12), 0.85)


def sfx_ball_flight(dur=0.55, seed=70, pan_from=-0.9, pan_to=0.9):
    """Fast ball fly-by: narrow whistle with doppler drop + air."""
    t = t_of(dur)
    u = t / dur
    shape = np.sin(np.pi * u) ** 1.5
    whistle_f = 2600 - 900 * smoothstep((u - 0.35) / 0.4)
    whistle = sweep(noise(dur, seed), 2600, 1700, "band", width=0.12, curve=smoothstep((u - 0.35) / 0.4)) * 3
    whistle += np.sin(2 * np.pi * np.cumsum(whistle_f) / SR) * 0.05
    air = sweep(noise(dur, seed + 1), 600, 3000, "band", width=1.0, curve=u) * 0.7
    x = (whistle + air) * shape
    return norm(reverb(pan(x, pan_from + (pan_to - pan_from) * u), HALL, -16), 0.8)


def sfx_trajectory(dur=1.7, seed=80):
    """Soft, airy trace for the opening green trajectory line."""
    t = t_of(dur)
    u = t / dur
    shape = smoothstep(u / 0.25) * smoothstep((1 - u) / 0.45)
    x = sweep(noise(dur, seed), 700, 2400, "band", width=0.5, curve=u) * shape
    x = x + np.sin(2 * np.pi * np.cumsum(880 + 220 * u) / SR) * shape * 0.04
    return norm(reverb(pan(x, -0.75 + 1.5 * smoothstep(u)), HALL, -12), 0.6)


def sfx_zip(dur=0.45, seed=90):
    """Thin line drawing across the frame: filtered high zip, left to right."""
    t = t_of(dur)
    u = t / dur
    x = sweep(noise(dur, seed), 3000, 9000, "band", width=0.3, curve=u) * np.sin(np.pi * u) ** 0.8
    x = x + np.sin(2 * np.pi * np.cumsum(1800 + 1600 * u) / SR) * np.sin(np.pi * u) * 0.08
    return norm(reverb(pan(x, -0.8 + 1.6 * u), ROOM, -10), 0.5)


def bell(freq, dur, index=2.2, ratio=1.4, decay=1.2):
    """FM bell: muted, slightly inharmonic metallic tone."""
    t = t_of(dur)
    mod = np.sin(2 * np.pi * freq * ratio * t) * index * np.exp(-t / (decay * 0.35))
    return np.sin(2 * np.pi * freq * t + mod) * env_exp(dur, decay, 0.003)


def sfx_metal_stab(root="D4", seed=95):
    """Muted metallic accent (brand colour, used sparingly)."""
    dur = 2.4
    x = sum(bell(HZ[n], dur, decay=d) * a for n, d, a in ((root, 0.9, 1.0), ("A4", 0.7, 0.5), ("D5", 0.5, 0.35)))
    return norm(reverb(lp(x, 6000), HALL, -8), 0.6)


def sfx_shimmer(dur=1.4, seed=97):
    """Glassy air for the green light sweep across the logo."""
    t = t_of(dur)
    u = t / dur
    shape = np.sin(np.pi * u) ** 2
    x = sweep(noise(dur, seed), 4000, 11000, "band", width=0.25, curve=u) * shape
    x = x + sum(np.sin(2 * np.pi * f * t) * 0.03 for f in (HZ["D5"] * 2, HZ["A4"] * 4)) * shape
    return norm(reverb(pan(x, -0.5 + u), HALL, -6), 0.4)


def sfx_final_impact():
    hit = sfx_impact(size=1.25, seed=11, f0=100, f1=29, tail=2.0)
    metal = sfx_metal_stab("D4")
    n = max(hit.shape[1], metal.shape[1])
    hit = np.pad(hit, ((0, 0), (0, n - hit.shape[1])))
    metal = np.pad(metal, ((0, 0), (0, n - metal.shape[1])))
    return norm(hit + metal * 0.45, 0.95)


# --------------------------------------------------------------------------
# Music
# --------------------------------------------------------------------------

def kick(f0=120.0, f1=44.0, decay=0.38, click=0.25, seed=300):
    dur = 0.9
    t = t_of(dur)
    f = f1 + (f0 - f1) * np.exp(-t / 0.04)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(dur, decay, 0.0008)
    c = hp(noise(dur, seed), 1500) * env_exp(dur, 0.003, 0.0001) * click
    return soft_clip(body + c, 1.3)


def hat(open_=False, seed=310):
    dur = 0.3 if open_ else 0.08
    x = hp(noise(dur, seed), 7500, 2) * env_exp(dur, 0.09 if open_ else 0.018, 0.0005)
    return x * (0.7 if open_ else 0.5)


def clap(seed=320):
    dur = 0.5
    t = t_of(dur)
    burst = np.zeros(n_of(dur))
    for k, off in enumerate((0.0, 0.011, 0.022)):
        e = np.zeros(n_of(dur))
        i = n_of(off)
        e[i:] = np.exp(-np.arange(n_of(dur) - i) / SR / (0.11 if k == 2 else 0.006))
        burst += e
    x = bp(noise(dur, seed), 900, 3200) * burst
    x = x + np.sin(2 * np.pi * 185 * t) * env_exp(dur, 0.05) * 0.4
    return reverb(x, HALL, -10)


def tom(f=95.0, seed=330):
    dur = 0.8
    t = t_of(dur)
    ff = f * (1 + 0.6 * np.exp(-t / 0.03))
    x = np.sin(2 * np.pi * np.cumsum(ff) / SR) * env_exp(dur, 0.22, 0.001)
    x = x + bp(noise(dur, seed), 200, 1200) * env_exp(dur, 0.02) * 0.3
    return reverb(soft_clip(x, 1.4), HALL, -12)


def snare_roll(start, end, bus, seed=340):
    """16ths accelerating to 32nds with a crescendo."""
    t = start
    k = 0
    while t < end - 0.01:
        u = (t - start) / (end - start)
        step = BEAT / 4 if u < 0.55 else BEAT / 8
        x = bp(noise(0.12, seed + k), 700, 5000) * env_exp(0.12, 0.03)
        x = x + np.sin(2 * np.pi * 200 * t_of(0.12)) * env_exp(0.12, 0.02) * 0.3
        place(bus, pan(x, 0.15 * np.sin(k)), t, -22 + 16 * u**1.5)
        t += step
        k += 1


def pluck(freq, dur=0.32, cutoff=900.0, seed=0):
    t = t_of(dur)
    x = 0.6 * saw(freq, t) + 0.4 * saw(freq * 1.003, t, 0.37)
    x = sweep(x, cutoff * 3, cutoff * 0.4, "low", curve=np.clip(t / 0.18, 0, 1))
    return x * env_exp(dur, 0.16, 0.002)


def pad_layer(notes_by_time, t_abs, cutoff_curve):
    """Detuned saw pad following (start, end, [notes]) chords, low-passed."""
    out = np.zeros(N)
    for start, end, notes in notes_by_time:
        i0, i1 = n_of(start), min(n_of(end), N)
        seg_t = t_abs[i0:i1]
        seg = np.zeros(i1 - i0)
        for note in notes:
            for k, det in enumerate((-0.006, 0.0, 0.007)):
                seg += saw(HZ[note] * (1 + det), seg_t, 0.13 * k) / 3
        fade = n_of(0.08)
        w = np.ones(i1 - i0)
        w[:fade] = np.linspace(0, 1, fade)
        w[-fade:] = np.linspace(1, 0, fade)
        out[i0:i1] += seg * w / len(notes) ** 0.5
    # Block-wise time-varying low-pass driven by the automation curve.
    res = np.zeros(N)
    zi = None
    for i in range(0, N, 512):
        f = float(cutoff_curve[min(i + 256, N - 1)])
        sos = butter(2, f, "low", fs=SR, output="sos")
        if zi is None:
            zi = sosfilt_zi(sos) * 0
        res[i : i + 512], zi = sosfilt(sos, out[i : i + 512], zi=zi)
    return res


def build_music():
    t = np.arange(N) / SR
    bus = np.zeros((2, N))
    drop, clear, final = CUE["drop"], CUE["clear"], CUE["logoFinal"]

    # Sub drone (D1 + D2), present all the way; swells, then drops back.
    drone = np.sin(2 * np.pi * HZ["D1"] * t) * 0.8 + np.sin(2 * np.pi * HZ["D2"] * t + 0.4) * 0.35
    drone *= 0.85 + 0.15 * np.sin(2 * np.pi * 0.23 * t)
    drone_lvl = (
        ramp(t, 0.0, 1.2, 0.0, 0.55)
        + ramp(t, 3.5, 12.2, 0.0, 0.25)
        - ramp(t, 16.2, 16.7, 0.0, 0.4)
        - ramp(t, 18.6, 19.45, 0.0, 0.4)
    )
    bus += stereo(drone * np.clip(drone_lvl, 0, 1))

    # Atmospheric rumble bed.
    rumble = lp(noise(DUR, 400), 85, 2) * 1.6 + lp(noise(DUR, 401), 300, 1) * 0.2
    rumble_lvl = ramp(t, 0, 0.8, 0, 0.5) - ramp(t, 3.4, 4.5, 0, 0.25) + ramp(t, 16.6, 17.2, 0, 0.15) - ramp(t, 18.8, 19.5, 0, 0.4)
    bus += pan(rumble * np.clip(rumble_lvl, 0, 1), 0.0)

    # Dark pad: Dm(add9) pedal, then i-VI-III-VII through the climax.
    chords = [
        (3.45, drop, ["D3", "A3", "E4"]),
        (drop, drop + 2 * BEAT, ["D3", "F3", "A3", "D4"]),
        (drop + 2 * BEAT, drop + 4 * BEAT, ["Bb2", "F3", "Bb3", "D4"]),
        (drop + 4 * BEAT, drop + 6 * BEAT, ["F3", "A3", "C4", "F4"]),
        (drop + 6 * BEAT, clear + 0.2, ["C3", "G3", "C4", "E4"]),
        (16.55, 19.5, ["D3", "A3", "E4"]),
    ]
    cutoff = (
        250
        + ramp(t, 3.5, 12.3, 0, 1100)
        + ramp(t, 12.4, 13.0, 0, 1900)
        - ramp(t, 16.0, 16.6, 0, 2600)
        + ramp(t, 17.4, 18.6, 0, 500)
    )
    pad = pad_layer(chords, t, np.clip(cutoff, 120, 6000))
    pad_lvl = ramp(t, 3.5, 5.0, 0, 0.30) + ramp(t, 11.0, 12.3, 0, 0.15) + ramp(t, 12.4, 12.6, 0, 0.12) - ramp(t, 16.2, 16.6, 0, 0.35) + ramp(t, 16.8, 17.6, 0, 0.12) - ramp(t, 18.8, 19.45, 0, 0.3)
    padL = pad * np.clip(pad_lvl, 0, 1)
    padR = np.roll(padL, n_of(0.011))  # Haas widening
    bus += reverb(np.stack([padL, padR]), HALL, -9)

    # Pulse grids: section A anchored at 3.5 s, section B anchored at the drop.
    grid_a = [3.5 + k * BEAT for k in range(12)]  # 3.5 .. 9.0
    grid_b = [drop + k * BEAT for k in range(-6, 8)]  # 9.4 .. 15.9

    # Bass plucks (8ths), filter opening as the build progresses.
    climax_roots = ["D2", "Bb1", "F2", "C2"]  # follows the pad: 2 beats per chord
    for beat_t in grid_a:
        if beat_t < CUE["logoLand"] - 0.01:
            continue
        for sub in (0, 0.5):
            tt_ = beat_t + sub * BEAT
            u = (tt_ - 4.5) / (9.0 - 4.5)
            place(bus, pan(pluck(HZ["D2"], cutoff=300 + 900 * u, seed=0), -0.1), tt_, -15 + 4 * u)
    for k, beat_t in enumerate(grid_b):
        for sub in (0, 0.5):
            tt_ = beat_t + sub * BEAT
            if tt_ >= clear:
                continue
            if beat_t < drop:
                u = (tt_ - 9.4) / 3.0
                note, cut, g = "D2", 900 + 900 * u, -12 + 2 * u
            else:
                note, cut, g = climax_roots[((k - 6) // 2) % 4], 2600, -9
            place(bus, pan(pluck(HZ[note], cutoff=cut, seed=k), 0.1), tt_, g)

    # Kicks: half-time in the brand build, every beat after, heavy in the climax.
    for beat_t in grid_a:
        if beat_t < CUE["logoLand"]:
            continue
        if beat_t < CUE["opening"] - 0.6 and (beat_t - 3.5) % (2 * BEAT) > 0.01:
            continue
        place(bus, kick(), beat_t, -9)
    for beat_t in grid_b:
        if beat_t >= clear or (CUE["riser"] + 0.45 < beat_t < drop):
            continue
        place(bus, kick(f0=140 if beat_t >= drop else 120, decay=0.45 if beat_t >= drop else 0.35), beat_t, -5 if beat_t >= drop else -8)

    # Hats: 8ths from the opening announcement, 16ths through the climax.
    for beat_t in grid_a:
        if beat_t < CUE["opening"]:
            continue
        for s in (0.5,):
            place(bus, pan(hat(seed=int(beat_t * 10)), 0.3), beat_t + s * BEAT, -19)
    for k, beat_t in enumerate(grid_b):
        if beat_t >= clear:
            continue
        steps = (0.25, 0.5, 0.75) if beat_t >= drop else (0.5,)
        for s in steps:
            accent = -15 if s == 0.5 else -21
            place(bus, pan(hat(open_=(s == 0.5 and beat_t >= drop), seed=500 + k * 4 + int(s * 4)), 0.3 * (1 if s != 0.25 else -1)), beat_t + s * BEAT, accent)

    # Claps on 2 and 4 in the climax; rim-ish clap on 2 and 4 in "play".
    for k, beat_t in enumerate(grid_b):
        if beat_t >= clear or (CUE["riser"] < beat_t < drop):
            continue
        if (k % 2) == 1:
            place(bus, clap(seed=600 + k), beat_t, -9 if beat_t >= drop else -17)

    # Snare roll into the drop, then a hard stop for the "suck" before it.
    snare_roll(CUE["riser"], drop - 0.1, bus)
    gap = (t > drop - 0.1) & (t < drop)
    bus[:, gap] *= np.linspace(1, 0.05, int(gap.sum()))

    return bus


# --------------------------------------------------------------------------
# Sound design bus
# --------------------------------------------------------------------------

def build_sfx(assets):
    bus = np.zeros((2, N))
    c = CUE

    # Scene 1: the hook.
    place(bus, assets["trajectory"], c["trajectoryStart"], -11)
    place(bus, assets["tick"], c["hastings"], -12)
    place(bus, assets["impact_soft"], c["hastings"] - 0.01, -14)
    place(bus, assets["impact_hit"], c["golfChange"], -2)
    place(bus, assets["reverse_swell"], c["wipeOut"] + 0.2 - assets["reverse_swell"].shape[1] / SR, -14)
    place(bus, assets["whoosh"], c["wipeOut"] - 0.25, -8)

    # Scene 2: arcs build (precise ticks), logo lands, tagline.
    for k in range(8):
        place(bus, pan(sfx_tick(2400 + 180 * k, seed=k), -0.6 + 0.17 * k), c["arcsStart"] + 0.12 * k, -20 + k)
    place(bus, assets["low_sweep"], c["arcsStart"] + 0.05, -10)
    place(bus, assets["impact_brand"], c["logoLand"], -5)
    place(bus, assets["metal"], c["logoLand"], -16)
    for k, off in enumerate((0.0, 0.07, 0.14)):
        place(bus, sfx_tick(4200 - 300 * k, seed=20 + k), c["tagline"] + off, -21)

    # Scene 3: expanding rings, OPENING, digit ticks, 2027 impact.
    place(bus, assets["riser_short"], c["ringsExpand"] - 0.55, -11)
    place(bus, assets["whoosh_wide"], c["ringsExpand"] - 0.2, -7)
    place(bus, assets["tick"], c["opening"], -13)
    for k in range(4):
        place(bus, pan(sfx_tick(2000 + 400 * k, seed=40 + k), -0.45 + 0.3 * k), c["early"] + 0.08 + 0.1 * k, -16)
    place(bus, assets["impact_deep"], c["digitsLand"], -2)

    # Scene 4: split line + two panel wipes.
    place(bus, assets["whoosh"], c["splitLine"] - 0.28, -11)
    place(bus, assets["zip"], c["splitLine"], -10)
    place(bus, sfx_whoosh(0.45, 500, 5000, seed=24, pan_from=-0.7, pan_to=0.1), c["memberships"] - 0.18, -9)
    place(bus, assets["tick"], c["memberships"] + 0.05, -15)
    place(bus, sfx_whoosh(0.45, 500, 5000, seed=25, pan_from=0.7, pan_to=-0.1), c["walkIns"] - 0.18, -9)
    place(bus, assets["tick"], c["walkIns"] + 0.05, -15)

    # Scene 5: riser, drop, ball strike + fly-by, word slams.
    place(bus, assets["riser"], c["riser"], -6)
    place(bus, assets["impact_drop"], c["drop"], 0)
    place(bus, assets["ball_strike"], c["drop"] - 0.02, -3)
    place(bus, assets["ball_flight"], c["drop"] + 0.02, -6)
    for cue_name, size in (("taking", 0.0), ("over", 0.0), ("hastings2", 1.0), ("golfScene", 0.0)):
        place(bus, tom(78 if size else 92, seed=700), c[cue_name], -9 if size else -12)
        place(bus, assets["tick"], c[cue_name], -14)
    place(bus, assets["metal"], c["hastings2"], -15)
    place(bus, assets["low_sweep"], c["clear"], -9)
    place(bus, assets["reverse_swell"], c["clear"] + 0.35 - assets["reverse_swell"].shape[1] / SR, -16)

    # Scene 6: the reveal, light sweep, final branded impact.
    place(bus, assets["impact_soft"], c["logoFinal"], -12)
    place(bus, assets["shimmer"], c["footer"] - 0.4, -12)
    place(bus, assets["final_impact"], c["finalHit"], -1)
    return bus


# --------------------------------------------------------------------------
# Voiceover bus, ducking, loudness and limiting
# --------------------------------------------------------------------------

def read_wav(path):
    sr, x = wavfile.read(path)
    if x.dtype == np.uint8:
        x = (x.astype(np.float64) - 128) / 2**7
    elif x.dtype.kind == "i":
        x = x.astype(np.float64) / 2 ** (8 * x.dtype.itemsize - 1)
    else:
        x = x.astype(np.float64)
    if x.ndim == 2:
        x = x.mean(axis=1)
    if sr != SR:
        x = resample_poly(x, SR, sr)
    return x


def build_vo():
    bus = np.zeros((2, N))
    missing = []
    for line in TL["vo"]:
        path = ROOT / "public/audio/vo" / f"{line['id']}.wav"
        if not path.exists():
            missing.append(line["id"])
            continue
        x = read_wav(path)
        x = norm(x, 0.7)
        place(bus, x, line["at"])
    # Close, intimate room so the voice sits in the mix rather than on top of it.
    bus = reverb(bus, ROOM, -20) + reverb(bus, HALL, -30, dry=0.0)
    return bus, missing


def duck_curve(vo, depth_db=-10.0, attack=0.04, release=0.35):
    """Music gain that dips under the voice (side-chain style)."""
    level = np.abs(vo).max(axis=0)
    win = n_of(0.03)
    level = np.convolve(level, np.ones(win) / win, mode="same")
    active = (level > 0.02).astype(float)
    g = np.empty(N)
    cur = 0.0
    a_coef, r_coef = np.exp(-1 / (attack * SR)), np.exp(-1 / (release * SR))
    for i in range(N):
        coef = a_coef if active[i] > cur else r_coef
        cur = coef * cur + (1 - coef) * active[i]
        g[i] = cur
    return 10 ** (depth_db * g / 20)


def k_weight(x):
    # ITU-R BS.1770 K-weighting at 48 kHz.
    pre = np.array([[1.53512485958697, -2.69169618940638, 1.19839281085285, 1.0, -1.69065929318241, 0.73248077421585]])
    rlb = np.array([[1.0, -2.0, 1.0, 1.0, -1.99004745483398, 0.99007225036621]])
    return sosfilt(rlb, sosfilt(pre, x))


def lufs(x):
    y = np.stack([k_weight(c) for c in stereo(x)])
    blk, hop = n_of(0.4), n_of(0.1)
    powers = np.array([np.sum(np.mean(y[:, i : i + blk] ** 2, axis=1)) for i in range(0, y.shape[1] - blk, hop)])
    loud = -0.691 + 10 * np.log10(powers + 1e-12)
    gated = powers[loud > -70]
    rel = -0.691 + 10 * np.log10(gated.mean()) - 10
    final = powers[(loud > -70) & (loud > rel)]
    return -0.691 + 10 * np.log10(final.mean())


def limiter_gain(x, ceiling_db=CEILING_DB, lookahead=0.005, release=0.08):
    """Gain curve for a look-ahead peak limiter (4x oversampled peak detection)."""
    ceiling = 10 ** (ceiling_db / 20)
    over = np.stack([resample_poly(c, 4, 1) for c in x])
    peak = np.abs(over).max(axis=0).reshape(-1, 4).max(axis=1)[:N]
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    la = n_of(lookahead)
    # Look-ahead: the gain reaches its target before the peak arrives.
    padded = np.concatenate([need, np.ones(la)])
    target = sliding_window_view(padded, la + 1).min(axis=1)[:N]
    g = np.empty(N)
    cur = 1.0
    r_coef = np.exp(-1 / (release * SR))
    a_coef = np.exp(-1 / (lookahead * SR / 3))
    for i in range(N):
        tgt = target[i]
        cur = a_coef * cur + (1 - a_coef) * tgt if tgt < cur else r_coef * cur + (1 - r_coef) * tgt
        g[i] = min(cur, tgt)
    return g


def fades(x, fade_in=0.08, fade_out=0.35):
    x = x.copy()
    x[:, : n_of(fade_in)] *= smoothstep(np.linspace(0, 1, n_of(fade_in)))
    x[:, -n_of(fade_out) :] *= smoothstep(np.linspace(1, 0, n_of(fade_out)))
    return x


def write(path, x):
    """Write a 48 kHz / 24-bit stereo WAV."""
    path.parent.mkdir(parents=True, exist_ok=True)
    x = stereo(x)
    pcm = np.ascontiguousarray((np.clip(x.T, -1, 1) * (2**23 - 1)).astype("<i4"))
    frames = pcm.view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(3)
        w.setframerate(SR)
        w.writeframes(frames)
    print(f"  {path.relative_to(ROOT)}")


def main():
    print("Synthesising sound design...")
    assets = {
        "tick": sfx_tick(),
        "impact_soft": sfx_impact(size=0.5, seed=12, f0=70, f1=40, tail=0.7),
        "impact_hit": sfx_impact(size=1.0, seed=13, f0=95, f1=32, tail=1.3),
        "impact_brand": sfx_impact(size=0.9, seed=14, f0=85, f1=36, tail=1.2),
        "impact_deep": sfx_impact(size=1.1, seed=15, f0=80, f1=28, tail=1.5),
        "impact_drop": sfx_impact(size=1.35, seed=16, f0=110, f1=30, tail=1.6),
        "final_impact": sfx_final_impact(),
        "whoosh": sfx_whoosh(0.7, 300, 4200, seed=21),
        "whoosh_wide": sfx_whoosh(0.9, 180, 3000, seed=22, pan_from=-0.2, pan_to=0.2),
        "reverse_swell": sfx_reverse_swell(1.1),
        "riser": sfx_riser(CUE["drop"] - 0.1 - CUE["riser"]),
        "riser_short": sfx_riser(0.6, seed=41, f0=500, f1=5000, tone_from=220),
        "low_sweep": sfx_low_sweep(),
        "ball_strike": sfx_ball_strike(),
        "ball_flight": sfx_ball_flight(),
        "trajectory": sfx_trajectory(CUE["trajectoryEnd"] - CUE["trajectoryStart"] + 0.3),
        "zip": sfx_zip(),
        "metal": sfx_metal_stab(),
        "shimmer": sfx_shimmer(),
    }
    for name, clip in assets.items():
        write(ROOT / f"public/audio/sfx/{name.replace('_', '-')}.wav", norm(stereo(clip), 0.89))

    print("Composing score...")
    music = build_music()
    sfx = build_sfx(assets)
    vo, missing = build_vo()

    # Bus balance before mastering.
    music *= 10 ** (-3 / 20)
    sfx *= 10 ** (-1 / 20)
    vo *= 10 ** (3 / 20)

    duck = duck_curve(vo) if not missing or len(missing) < len(TL["vo"]) else np.ones(N)
    music_ducked = music * duck

    def master(*stems):
        mix = sum(stems)
        gain = 10 ** ((TARGET_LUFS - lufs(mix)) / 20)
        stems = [fades(s * gain) for s in stems]
        g = limiter_gain(sum(stems))
        return [s * g for s in stems]

    print("Mixing and mastering...")
    vo_m, music_m, sfx_m = master(vo, music_ducked, sfx)
    mix = vo_m + music_m + sfx_m
    write(ROOT / "public/audio/stems/vo.wav", vo_m)
    write(ROOT / "public/audio/stems/music.wav", music_m)
    write(ROOT / "public/audio/stems/sfx.wav", sfx_m)
    write(ROOT / "public/audio/mix.wav", mix)

    music_nv, sfx_nv = master(music, sfx)
    write(ROOT / "public/audio/mix-no-vo.wav", music_nv + sfx_nv)

    peak_db = 20 * np.log10(np.max(np.abs(mix)) + 1e-12)
    print(f"Master: {lufs(mix):.1f} LUFS integrated, sample peak {peak_db:.2f} dBFS, {mix.shape[1] / SR:.3f} s")
    if missing:
        print(f"WARNING: missing voiceover clips: {', '.join(missing)}")


if __name__ == "__main__":
    main()
