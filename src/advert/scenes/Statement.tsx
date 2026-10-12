import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { EASE } from "../../motion/easing";
import { kick, lerp, prog, useTime } from "../../teaser/components/time";
import { Trajectory } from "../../teaser/components/Trajectory";
import { DISPLAY, INK } from "../../teaser/theme";
import { beatPulse, shakeAll } from "../components/kinetics";
import { Punch } from "../components/Punch";
import { TYPE_SHADOW } from "../style";
import { CUE } from "../timeline";

const GREEN = "#27B936";

type Word = { text: string; at: number; block?: boolean };

// One word per hit: the lead word of each line on the beat, its partner on an
// 8th or a 16th pickup, so the statement lands in 1.2s. Each line was
// measured to span ~760px at Archivo 70% / 800.
const LINES: { size: number; words: Word[] }[] = [
  {
    size: 142,
    words: [
      { text: "TAKING", at: CUE.taking },
      { text: "OVER", at: CUE.over },
    ],
  },
  {
    size: 124,
    words: [
      { text: "THE", at: CUE.the },
      { text: "HASTINGS", at: CUE.hastings, block: true },
    ],
  },
  {
    size: 149,
    words: [
      { text: "GOLF", at: CUE.golf },
      { text: "SCENE.", at: CUE.scene },
    ],
  },
];

const BIG_HITS = [CUE.taking, CUE.hastings, CUE.scene];

// The ball, still in flight from the strike, crossing far behind the type.
const ARC = "M -120 1460 C 260 1120, 760 760, 1200 520";

// HASTINGS lands on a block of brand green that wipes in under it, knocked
// out in black: the one word in the film set in reverse.
const Block: React.FC<{ t: number; at: number; children: React.ReactNode }> = ({
  t,
  at,
  children,
}) => {
  const wipe = prog(t, at - 0.02, 0.16, EASE.outExpo);
  const shine = interpolate(t, [at + 1.0, at + 1.6], [-40, 140], {
    easing: EASE.inOutCubic,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ position: "relative", padding: "0.02em 0.14em 0.04em" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: GREEN,
          transform: `scaleX(${wipe})`,
          transformOrigin: "0% 50%",
          boxShadow: `0 0 ${lerp(80, 30, wipe)}px rgba(39,185,54,${0.45 * wipe})`,
          backgroundImage: `linear-gradient(105deg, rgba(255,255,255,0) ${shine - 12}%, rgba(255,255,255,0.45) ${shine}%, rgba(255,255,255,0) ${shine + 12}%)`,
        }}
      />
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
};

// Scene 2 (3.6-7.1s): straight out of the strike, the statement slams in word
// by word on the groove, the frame kicking and shaking on each line's hit and
// pulsing on every beat while it holds. Then it blasts out towards camera.
export const Statement: React.FC = () => {
  const t = useTime();
  const push = interpolate(t, [CUE.taking, CUE.statementOut], [1, 1.05], {
    easing: EASE.outCubic,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hits =
    BIG_HITS.reduce((sum, at) => sum + 0.03 * kick(t, at, 0.12), 0) +
    0.012 * beatPulse(t, CUE.scene + 0.3, CUE.statementOut);
  const arc = prog(t, CUE.taking - 0.2, 2.6, EASE.inOutSine);

  return (
    <AbsoluteFill>
      <Trajectory
        d={ARC}
        progress={arc}
        trail={0.4}
        width={3}
        trace={0.14}
        opacity={0.75}
        ballRadius={4}
      />
      <AbsoluteFill
        style={{
          transform: `${shakeAll(
            t,
            BIG_HITS.map((at) => [at, 9] as const),
          )} scale(${push * (1 + hits)})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 880,
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            filter: TYPE_SHADOW,
          }}
        >
          {LINES.map((line, i) => {
            // Exit: each line blasts towards camera, bottom line first.
            const out = prog(
              t,
              CUE.statementOut + (LINES.length - 1 - i) * 0.035,
              0.2,
              EASE.inCubic,
            );
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.22em",
                  fontSize: line.size,
                  opacity: 1 - out,
                  transform: `scale(${1 + 0.4 * out})`,
                  filter: out > 0.01 ? `blur(${out * 14}px)` : undefined,
                }}
              >
                {line.words.map((w) => {
                  const word = (
                    <div
                      style={{
                        ...DISPLAY,
                        fontSize: line.size,
                        lineHeight: 0.92,
                        color: w.block ? INK.black : INK.white,
                      }}
                    >
                      {w.text}
                    </div>
                  );
                  return (
                    <Punch key={w.text} t={t} at={w.at} from={1.55}>
                      {w.block ? (
                        <Block t={t} at={w.at}>
                          {word}
                        </Block>
                      ) : (
                        word
                      )}
                    </Punch>
                  );
                })}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
