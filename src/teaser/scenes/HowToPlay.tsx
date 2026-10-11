import React from "react";
import { AbsoluteFill } from "remotion";
import { EASE } from "../../motion/easing";
import { ContourField } from "../components/ContourField";
import { MaskLine } from "../components/MaskLine";
import { lerp, prog, useTime } from "../components/time";
import { DEPTH_SHADOW, DISPLAY, INK, LABEL, SIZE } from "../theme";
import { CUE } from "../timeline";

const LINE_Y = 900;
const COLLAPSE = 12.08;

const Index: React.FC<{ n: string; progress: number }> = ({ n, progress }) => (
  <div
    style={{
      ...LABEL,
      fontSize: 26,
      letterSpacing: "0.3em",
      color: INK.green,
      opacity: progress,
      transform: `translateY(${(1 - progress) * 12}px)`,
      display: "flex",
      alignItems: "center",
      gap: 18,
    }}
  >
    <span
      style={{
        display: "inline-block",
        width: 46 * progress,
        height: 2,
        backgroundColor: INK.green,
      }}
    />
    {n}
  </div>
);

// Scene 4 (9.3-12.4s): a glowing line splits the frame. "MEMBERSHIPS" rises
// out of it on a panel sliding in from the left; "WALK-INS WELCOME" drops out
// of it on a panel sliding in from the right. Before the drop everything
// folds back into the line, which collapses to a point.
export const HowToPlay: React.FC = () => {
  const t = useTime();

  const draw = prog(t, CUE.splitLine, 0.42, EASE.inOutQuart);
  const collapse = prog(t, COLLAPSE, 0.24, EASE.inExpo);
  const pinch = prog(t, COLLAPSE + 0.12, 0.2, EASE.inExpo);
  const top = prog(t, CUE.memberships, 0.7);
  const bottom = (k: number) => prog(t, CUE.walkIns + k * 0.08, 0.7);
  const topPanel = prog(t, CUE.memberships - 0.08, 0.8, EASE.outExpo);
  const bottomPanel = prog(t, CUE.walkIns - 0.08, 0.8, EASE.outExpo);
  const lineX0 = lerp(0, 540, pinch);
  const lineX1 = lerp(1080 * draw, 540, pinch);
  const lineOpacity = 1 - prog(t, COLLAPSE + 0.28, 0.06, EASE.linear);

  return (
    <AbsoluteFill>
      <ContourField t={t} opacity={0.32} driftY={(t - CUE.splitLine) * 40} />

      {/* Shifting panels */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: LINE_Y - 330,
          width: 1080,
          height: 330,
          transform: `translateX(${(topPanel - 1) * 1080 + (t - CUE.memberships) * 12}px)`,
          opacity: 0.9 * (1 - collapse),
          background: `linear-gradient(90deg, rgba(16,42,32,0) 0%, rgba(16,42,32,0.75) 30%, rgba(16,42,32,0.55) 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: LINE_Y,
          width: 1080,
          height: 470,
          transform: `translateX(${(1 - bottomPanel) * 1080 - (t - CUE.walkIns) * 12}px)`,
          opacity: 0.9 * (1 - collapse),
          background: `linear-gradient(270deg, rgba(16,42,32,0) 0%, rgba(16,42,32,0.75) 30%, rgba(16,42,32,0.55) 100%)`,
        }}
      />

      {/* Above the line: rises out of it */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 1920 - LINE_Y + 34,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 26,
        }}
      >
        <Index n="01" progress={top * (1 - collapse)} />
        <MaskLine progress={Math.min(top, 1 - collapse)} from="below">
          <div
            style={{
              ...DISPLAY,
              fontSize: SIZE.play,
              textShadow: DEPTH_SHADOW,
            }}
          >
            MEMBERSHIPS
          </div>
        </MaskLine>
      </div>

      {/* Below the line: drops out of it */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: LINE_Y + 38,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        {["WALK-INS", "WELCOME"].map((word, k) => (
          <MaskLine
            key={word}
            progress={Math.min(bottom(k), 1 - collapse)}
            from="above"
          >
            <div
              style={{
                ...DISPLAY,
                fontSize: SIZE.play,
                lineHeight: 0.92,
                color: k === 1 ? INK.green : INK.white,
                textShadow: DEPTH_SHADOW,
              }}
            >
              {word}
            </div>
          </MaskLine>
        ))}
        <div style={{ height: 18 }} />
        <Index n="02" progress={bottom(1) * (1 - collapse)} />
      </div>

      {/* The split line */}
      <svg
        width={1080}
        height={1920}
        style={{ position: "absolute", inset: 0 }}
      >
        <line
          x1={lineX0}
          y1={LINE_Y}
          x2={lineX1}
          y2={LINE_Y}
          stroke={INK.green}
          strokeWidth={12}
          strokeOpacity={0.4 * lineOpacity}
          style={{ filter: "blur(9px)" }}
        />
        <line
          x1={lineX0}
          y1={LINE_Y}
          x2={lineX1}
          y2={LINE_Y}
          stroke={INK.white}
          strokeWidth={2}
          strokeOpacity={0.9 * lineOpacity}
        />
        {draw > 0 && draw < 1 ? (
          <circle
            cx={lineX1}
            cy={LINE_Y}
            r={7}
            fill={INK.white}
            style={{ filter: "blur(2px)" }}
          />
        ) : null}
        {pinch > 0 ? (
          <circle
            cx={540}
            cy={LINE_Y}
            r={lerp(4, 26, pinch)}
            fill={INK.white}
            opacity={lineOpacity * pinch}
            style={{ filter: "blur(6px)" }}
          />
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};
