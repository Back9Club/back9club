import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { EASE } from "../../motion/easing";
import { ContourField } from "../../teaser/components/ContourField";
import { MotionBlur } from "../../teaser/components/MotionBlur";
import { kick, lerp, prog, useTime } from "../../teaser/components/time";
import { DISPLAY, INK } from "../../teaser/theme";
import { beatPulse, shakeAll } from "../components/kinetics";
import { Punch } from "../components/Punch";
import { TYPE_SHADOW } from "../style";
import { CUE, FPS, YEAR_ROLL } from "../timeline";

const YEAR = [2, 0, 2, 7];
const YEAR_SIZE = 410;
const CELL = YEAR_SIZE; // one reel cell per digit, 1em tall
const YEAR_TOP = 760;
const METAL =
  "linear-gradient(180deg, #FFFFFF 0%, #F4F5F0 42%, #C9CFCB 78%, #9EA7A2 100%)";
const DIGIT: React.CSSProperties = {
  ...DISPLAY,
  fontSize: YEAR_SIZE,
  lineHeight: `${CELL}px`,
  fontVariantNumeric: "tabular-nums",
};

/** When digit i locks: one 16th apart, the last on the impact. */
export const lockAt = (i: number) =>
  CUE.yearLand - (YEAR.length - 1 - i) * YEAR_ROLL.lockStep;

/**
 * Cells still to travel before digit i locks. The reel spins at a constant
 * speed, decelerates over the last `decelCells` cells and lands with a small
 * clunk. scripts/advert/build_audio.py places its ratchet on the same curve.
 */
const cellsLeft = (t: number, i: number) => {
  const { decelCells: n, decel: d, endSpeed: a } = YEAR_ROLL;
  const r = lockAt(i) - t;
  if (r <= 0) return -0.1 * Math.sin(2 * Math.PI * 7 * -r) * Math.exp(r / 0.06);
  if (r < d) {
    const x = r / d;
    return n * (a * x + (1 - a) * x * x);
  }
  return n + ((n * (2 - a)) / d) * (r - d);
};

const digitStyle = (cell: number): React.CSSProperties => ({
  ...DIGIT,
  position: "absolute",
  left: 0,
  right: 0,
  top: cell * CELL,
  textAlign: "center",
  backgroundImage: METAL,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
});

// One reel: only the cells around the window are drawn.
const Reel: React.FC<{ t: number; i: number }> = ({ t, i }) => {
  const idx = YEAR[i] + cellsLeft(t, i);
  const speed = Math.abs(idx - (YEAR[i] + cellsLeft(t - 1 / FPS, i))) * CELL;
  const base = Math.floor(idx);
  const lockHit = kick(t, lockAt(i), 0.09);
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        height: CELL,
        transform: `scale(${1 + 0.05 * lockHit})`,
        filter: lockHit > 0.02 ? `brightness(${1 + 0.5 * lockHit})` : undefined,
      }}
    >
      <div style={{ ...DIGIT, visibility: "hidden" }}>0</div>
      <MotionBlur
        amount={Math.min(45, speed * 0.12)}
        style={{ position: "absolute", inset: 0 }}
      >
        {[base - 1, base, base + 1, base + 2].map((k) => (
          <div key={k} style={digitStyle(k - idx)}>
            {((k % 10) + 10) % 10}
          </div>
        ))}
      </MotionBlur>
    </div>
  );
};

// Scene 3 (7.0-10.4s): OPENING and EARLY slam in on the beat over living
// putting-green contours, then 2027 spins up like a counter and locks one
// digit per 16th, the 7 landing on the impact with a flash and a shake. A
// sheen crosses the year, a green rule snaps out beneath, and the scene exits
// by zooming through the year.
export const OpeningYear: React.FC = () => {
  const t = useTime();
  const enter = prog(t, CUE.statementOut + 0.1, 0.3, EASE.outCubic);
  const exit = prog(t, CUE.openingOut, 0.22, EASE.inCubic);
  const impact = kick(t, CUE.yearLand, 0.16);
  const pulse = beatPulse(t, CUE.yearLand + 0.3, CUE.openingOut);
  const drift = interpolate(t, [CUE.opening, CUE.openingOut], [1.04, 1], {
    easing: EASE.outCubic,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sheen = interpolate(
    t,
    [CUE.yearLand + 0.1, CUE.yearLand + 0.8],
    [-30, 130],
    {
      easing: EASE.inOutCubic,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const reels = prog(t, CUE.spin, 0.08, EASE.linear);
  const rule = prog(t, CUE.yearLand, 0.3);
  const flash = kick(t, CUE.yearLand, 0.1);

  return (
    <AbsoluteFill
      style={{
        opacity: enter * (1 - exit),
        transform: `${shakeAll(t, [
          [CUE.opening, 5],
          [CUE.early, 5],
          [CUE.yearLand, 14],
        ])} scale(${drift * (1 + 0.04 * impact + 0.01 * pulse) * (1 + 0.6 * exit)})`,
        filter: exit > 0.01 ? `blur(${exit * 20}px)` : undefined,
      }}
    >
      <ContourField
        t={t}
        opacity={0.75}
        pulse={impact}
        driftY={(t - CUE.opening) * 22}
      />

      {/* Landing flash behind the year. */}
      {flash > 0.01 ? (
        <AbsoluteFill
          style={{
            opacity: 0.9 * flash,
            background: `radial-gradient(42% 14% at 50% ${((YEAR_TOP + CELL / 2) / 1920) * 100}%, rgba(235,255,242,0.55) 0%, rgba(43,212,110,0.25) 45%, rgba(0,0,0,0) 100%)`,
            mixBlendMode: "screen",
          }}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          top: 630,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: "0.24em",
          fontSize: 104,
          filter: TYPE_SHADOW,
        }}
      >
        <Punch t={t} at={CUE.opening} from={1.5}>
          <div style={{ ...DISPLAY, fontSize: 104 }}>OPENING</div>
        </Punch>
        <Punch t={t} at={CUE.early} from={1.5}>
          <div style={{ ...DISPLAY, fontSize: 104, color: "#27B936" }}>
            EARLY
          </div>
        </Punch>
      </div>

      <div
        style={{
          position: "absolute",
          top: YEAR_TOP,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: reels,
        }}
      >
        <div style={{ position: "relative", display: "flex" }}>
          <div
            style={{
              display: "flex",
              filter: "drop-shadow(0 30px 50px rgba(0,0,0,0.55))",
            }}
          >
            {YEAR.map((_, i) => (
              <Reel key={i} t={t} i={i} />
            ))}
          </div>
          {sheen > -30 && sheen < 130 ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                backgroundImage: `linear-gradient(105deg, rgba(255,255,255,0) ${sheen - 14}%, rgba(120,232,168,0.8) ${sheen}%, rgba(255,255,255,0) ${sheen + 14}%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                pointerEvents: "none",
              }}
            >
              {YEAR.map((digit, i) => (
                <div key={i} style={{ ...DIGIT, color: "transparent" }}>
                  {digit}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: YEAR_TOP + CELL * 0.93,
          left: 540 - 320 * rule,
          width: 640 * rule,
          height: 5,
          borderRadius: 3,
          background: `linear-gradient(90deg, rgba(39,185,54,0), ${INK.green} 20%, #27B936 50%, ${INK.green} 80%, rgba(39,185,54,0))`,
          boxShadow: `0 0 ${lerp(40, 22, rule)}px rgba(39,185,54,${0.7 * rule})`,
          opacity: rule,
        }}
      />
    </AbsoluteFill>
  );
};
