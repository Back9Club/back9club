import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { EASE } from "../../motion/easing";
import { Logo } from "../../teaser/components/Logo";
import { MaskLine } from "../../teaser/components/MaskLine";
import { kick, lerp, prog, useTime } from "../../teaser/components/time";
import { DISPLAY, INK, LABEL } from "../../teaser/theme";
import { TYPE_SHADOW } from "../style";
import { CUE } from "../timeline";

const LOGO_W = 780;
const LOGO_H = (LOGO_W * 1504) / 2936;
const LOGO_TOP = 600;
const FLOOR_Y = LOGO_TOP + LOGO_H - 52; // the logo's baseline rules sit on the floor

// Neon tube warming up: quick, uneven flicker that settles fully on.
const NEON_KEYS = [0, 0.04, 0.08, 0.12, 0.16, 0.22, 0.27, 0.32, 0.4];
const NEON_VALS = [0, 0.85, 0.1, 0.95, 0.25, 1, 0.6, 1, 1];

const WORDS = [
  { text: "WATCH", at: CUE.watch },
  { text: "THIS", at: CUE.watch + 0.2 },
  { text: "SPACE.", at: CUE.watch + 0.4 },
];

// Scene 5 (13.4-18s): the payoff. A green spotlight finds a glossy black
// floor; the 9 flickers on like neon, the lettering wipes in on the biggest
// hit, light sweeps across the name, the logo reflects in the floor, then the
// call to action and the date. Holds to the end.
export const LogoFinale: React.FC = () => {
  const t = useTime();

  const stage = prog(t, CUE.accessOut + 0.2, 0.9, EASE.inOutSine);
  const neon = interpolate(t - CUE.neon, NEON_KEYS, NEON_VALS, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const white = prog(t, CUE.logoOn - 0.04, 0.6, EASE.inOutCubic);
  const hit = kick(t, CUE.logoOn, 0.4);
  const finalHit = kick(t, CUE.finalHit, 0.5);
  const sweep = interpolate(t, [CUE.sweep, CUE.sweep + 0.9], [-0.25, 1.25], {
    easing: EASE.inOutCubic,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sweep2 = interpolate(
    t,
    [CUE.finalHit - 0.15, CUE.finalHit + 0.75],
    [-0.25, 1.25],
    {
      easing: EASE.inOutCubic,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const push = interpolate(t, [CUE.neon, 18], [1.04, 1], {
    easing: EASE.outCubic,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const footer = prog(t, CUE.footer, 0.9);
  const glow =
    0.35 * prog(t, CUE.logoOn, 1.2, EASE.outCubic) +
    0.55 * hit +
    0.3 * finalHit;
  const activeSweep = t < CUE.finalHit - 0.15 ? sweep : sweep2;

  const logo = (
    <Logo
      width={LOGO_W}
      white={white}
      green={1}
      whiteFrom="left"
      greenOpacity={neon}
      greenGlow={Math.min(1, 0.55 * neon + 0.5 * hit)}
      sweep={activeSweep}
      glow={glow}
    />
  );

  return (
    <AbsoluteFill style={{ transform: `scale(${push * (1 + 0.012 * hit)})` }}>
      {/* Spotlight cone and the pool of light it throws on the floor. */}
      <AbsoluteFill style={{ opacity: stage }}>
        {/* A soft overhead pool of green light, fading out before the floor. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: FLOOR_Y + 120,
            background:
              "radial-gradient(48% 70% at 50% 6%, rgba(43,212,110,0.16) 0%, rgba(43,212,110,0.07) 45%, rgba(43,212,110,0) 80%)",
            maskImage:
              "linear-gradient(180deg, black 0%, black 70%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(180deg, black 0%, black 70%, transparent 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 540 - 520,
            top: FLOOR_Y - 60,
            width: 1040,
            height: 260,
            borderRadius: "50%",
            background: `radial-gradient(closest-side, rgba(43,212,110,${0.22 + 0.2 * hit}), rgba(16,42,32,0.25) 55%, rgba(9,13,11,0) 100%)`,
          }}
        />
        {/* Floor horizon. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: FLOOR_Y,
            height: 1,
            background:
              "linear-gradient(90deg, rgba(244,245,240,0), rgba(244,245,240,0.16), rgba(244,245,240,0))",
          }}
        />
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          left: (1080 - LOGO_W) / 2,
          top: LOGO_TOP,
        }}
      >
        {logo}
      </div>

      {/* Reflection in the glossy floor. */}
      {/* Mirrored across the floor line and clipped to the floor. */}
      <div
        style={{
          position: "absolute",
          left: (1080 - LOGO_W) / 2,
          top: FLOOR_Y,
          width: LOGO_W,
          height: LOGO_H,
          overflow: "hidden",
          opacity: 0.18,
          filter: "blur(3px)",
          maskImage:
            "linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0) 50%)",
          WebkitMaskImage:
            "linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0) 50%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: -(FLOOR_Y - LOGO_TOP),
            transform: "scaleY(-1)",
            transformOrigin: `50% ${FLOOR_Y - LOGO_TOP}px`,
          }}
        >
          {logo}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 1230,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: "0.24em",
          fontSize: 92,
          filter: TYPE_SHADOW,
        }}
      >
        {WORDS.map((w) => (
          <MaskLine key={w.text} progress={prog(t, w.at, 0.55)}>
            <div
              style={{
                ...DISPLAY,
                fontSize: 92,
                color: INK.white,
              }}
            >
              {w.text}
            </div>
          </MaskLine>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          top: 1420,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 24,
          opacity: 0.78 * footer,
        }}
      >
        <div
          style={{ width: 64 * footer, height: 1, backgroundColor: "#27B936" }}
        />
        <div
          style={{
            ...LABEL,
            fontSize: 26,
            letterSpacing: `${lerp(0.6, 0.42, footer)}em`,
            marginRight: `-${lerp(0.6, 0.42, footer)}em`,
          }}
        >
          Opening early 2027
        </div>
        <div
          style={{ width: 64 * footer, height: 1, backgroundColor: "#27B936" }}
        />
      </div>
    </AbsoluteFill>
  );
};
