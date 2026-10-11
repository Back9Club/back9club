import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { EASE } from "../../motion/easing";
import { kick, lerp, prog, useTime } from "../components/time";
import { Trajectory } from "../components/Trajectory";
import { DISPLAY } from "../theme";
import { CUE } from "../timeline";

const DRIVE = "M -90 1600 C 240 870, 650 500, 1200 320";
const DRIFT = "M 1170 1590 C 800 1350, 360 1300, -90 1430";

// Justified poster stack: each line measured to span 740px (OVER is capped so
// it doesn't overpower the rest).
const LINES = [
  { text: "TAKING", size: 244, cue: CUE.taking },
  { text: "OVER", size: 300, cue: CUE.over },
  { text: "HASTINGS'", size: 173, cue: CUE.hastings2, accent: true },
  { text: "GOLF SCENE.", size: 145, cue: CUE.golfScene },
] as const;

const BLOCK_CENTER = 905;
const LINE_HEIGHT = 0.88;
const BLOCK_HEIGHT = LINES.reduce((h, l) => h + l.size * LINE_HEIGHT, 0);

const GREEN_FILL =
  "linear-gradient(180deg, #3CC27C 0%, #238B57 58%, #1A6B43 100%)";

const SlamWord: React.FC<{
  text: string;
  size: number;
  t: number;
  cue: number;
  accent?: boolean;
}> = ({ text, size, t, cue, accent = false }) => {
  const p = prog(t, cue - 0.02, 0.36, EASE.outExpo);
  const visible = prog(t, cue - 0.02, 0.07, EASE.linear);
  const sweep = interpolate(t, [cue + 0.12, cue + 0.9], [-30, 130], {
    easing: EASE.inOutCubic,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fill: React.CSSProperties = accent
    ? {
        backgroundImage: `linear-gradient(105deg, rgba(255,255,255,0) ${sweep - 12}%, rgba(200,255,220,0.9) ${sweep}%, rgba(255,255,255,0) ${sweep + 12}%), ${GREEN_FILL}`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }
    : {};

  const style: React.CSSProperties = {
    ...DISPLAY,
    fontSize: size,
    lineHeight: LINE_HEIGHT,
    ...fill,
  };

  return (
    <div style={{ position: "relative", opacity: visible }}>
      {/* Motion trail: a ghost that overshoots and fades as the word lands. */}
      {p < 0.999 ? (
        <div
          style={{
            ...style,
            position: "absolute",
            inset: 0,
            textAlign: "center",
            opacity: 0.28 * (1 - p),
            transform: `scale(${lerp(2.1, 1.08, p)})`,
            filter: `blur(${lerp(26, 6, p)}px)`,
          }}
        >
          {text}
        </div>
      ) : null}
      <div
        style={{
          ...style,
          transform: `scale(${lerp(1.42, 1, p)})`,
          filter:
            p < 0.999
              ? `blur(${(1 - p) * 16}px) drop-shadow(0 24px 40px rgba(0,0,0,0.6))`
              : "drop-shadow(0 24px 40px rgba(0,0,0,0.6))",
        }}
      >
        {text}
      </div>
    </div>
  );
};

// Scene 5 (12.4-16.6s): the climax. On the drop a golf ball is driven across
// the frame with a flash of light; the camera pushes in while the statement
// slams in word by word on the beat, HASTINGS' in green. Clears by flying
// through the type.
export const BigStatement: React.FC = () => {
  const t = useTime();

  const drive = prog(t, CUE.drop, 0.5, EASE.outCubic);
  const driveFade = 1 - prog(t, CUE.drop + 0.3, 0.45, EASE.inOutCubic);
  const drift = prog(t, 14.7, 1.4, EASE.inOutSine);
  const flash = kick(t, CUE.drop, 0.13);

  const push = interpolate(t, [CUE.drop, CUE.clear], [1, 1.08], {
    easing: EASE.outCubic,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const slam =
    0.03 * kick(t, CUE.taking, 0.14) +
    0.03 * kick(t, CUE.over, 0.14) +
    0.045 * kick(t, CUE.hastings2, 0.18) +
    0.03 * kick(t, CUE.golfScene, 0.14);
  const tilt = 1 - prog(t, CUE.drop, 1.2, EASE.outExpo);
  const clear = prog(t, CUE.clear - 0.05, 0.45, EASE.inCubic);

  return (
    <AbsoluteFill>
      <Trajectory
        d={DRIFT}
        progress={drift}
        trail={0.3}
        width={2.5}
        trace={0.12}
        opacity={0.55}
        ballRadius={4}
      />

      <AbsoluteFill
        style={{
          transform: `perspective(1600px) rotateX(${tilt * 10}deg) rotateZ(${-1.6 * tilt}deg) scale(${push * (1 + slam) * (1 + 0.45 * clear)})`,
          opacity: 1 - clear,
          filter: clear > 0.01 ? `blur(${26 * clear}px)` : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: BLOCK_CENTER - BLOCK_HEIGHT / 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {LINES.map((line) => (
            <SlamWord
              key={line.text}
              text={line.text}
              size={line.size}
              t={t}
              cue={line.cue}
              accent={"accent" in line}
            />
          ))}
        </div>
      </AbsoluteFill>

      <Trajectory
        d={DRIVE}
        progress={drive}
        trail={0.55}
        width={7}
        trace={0.28}
        opacity={driveFade}
        ballRadius={9}
      />

      <AbsoluteFill
        style={{
          opacity: 0.32 * flash,
          background:
            "radial-gradient(80% 60% at 30% 70%, rgba(220,255,235,0.9) 0%, rgba(35,139,87,0.4) 40%, rgba(0,0,0,0) 75%)",
        }}
      />
    </AbsoluteFill>
  );
};
