import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { EASE } from "../../motion/easing";
import { MaskLine } from "../../teaser/components/MaskLine";
import { kick, prog, useTime } from "../../teaser/components/time";
import { Trajectory } from "../../teaser/components/Trajectory";
import { DISPLAY, INK } from "../../teaser/theme";
import { TYPE_SHADOW } from "../style";
import { CUE } from "../timeline";

// Each line measured to span ~760px at Archivo 70% / 800.
const LINES = [
  { cue: CUE.taking, size: 142, content: <>TAKING OVER</> },
  {
    cue: CUE.hastings,
    size: 132,
    content: (
      <>
        THE <span style={{ color: "#27B936" }}>HASTINGS</span>
      </>
    ),
  },
  { cue: CUE.scene, size: 149, content: <>GOLF SCENE.</> },
];

// The ball, still in flight from the strike, crossing far behind the type.
const ARC = "M -120 1460 C 260 1120, 760 760, 1200 520";

// Scene 2 (3.6-7.0s): straight out of the strike, the statement lands one
// line per beat, rising out of hard masks, HASTINGS in the brand green. The
// camera creeps in, kicking on each hit, then the lines exit upwards.
export const Statement: React.FC = () => {
  const t = useTime();
  const push = interpolate(t, [CUE.taking, CUE.statementOut], [1, 1.06], {
    easing: EASE.outCubic,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hits = LINES.reduce((sum, l) => sum + 0.018 * kick(t, l.cue, 0.16), 0);
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
      <AbsoluteFill style={{ transform: `scale(${push * (1 + hits)})` }}>
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
            gap: 10,
            filter: TYPE_SHADOW,
          }}
        >
          {LINES.map((line, i) => (
            <MaskLine
              key={i}
              progress={prog(t, line.cue - 0.04, 0.6)}
              exit={prog(t, CUE.statementOut + i * 0.05, 0.3, EASE.inCubic)}
            >
              <div
                style={{
                  ...DISPLAY,
                  fontSize: line.size,
                  lineHeight: 0.92,
                  color: INK.white,
                }}
              >
                {line.content}
              </div>
            </MaskLine>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
