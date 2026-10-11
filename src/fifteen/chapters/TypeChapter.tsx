import { evolvePath } from "@remotion/paths";
import React from "react";
import { AbsoluteFill, spring, useVideoConfig } from "remotion";
import { EASE, SPRING } from "../../motion/easing";
import { kick, lerp, prog } from "../../teaser/components/time";
import { useChapterTime } from "../time";
import { C, MONO_LABEL, WIDE } from "../theme";
import { CUE } from "../timeline";

const SLICES = [0.9, -0.55, 0.75, -1, 0.45, -0.7];

const PLOT = { x: 230, y: 1070, w: 620, h: 250 };
const CURVE = Array.from({ length: 61 }, (_, i) => {
  const u = i / 60;
  return [PLOT.x + u * PLOT.w, PLOT.y + PLOT.h - EASE.outExpo(u) * PLOT.h];
});
const CURVE_PATH = CURVE.map(
  ([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`,
).join(" ");

// The literal maths behind the motion: the easing curve "MATH." moved on,
// drawn like a graph editor, with a dot riding it and its value read out.
const EasingPlot: React.FC<{ t: number }> = ({ t }) => {
  const appear = prog(t, CUE.math + 0.3, 0.5, EASE.outCubic);
  const draw = prog(t, CUE.math + 0.35, 0.6, EASE.inOutCubic);
  const u = prog(t, CUE.math + 0.6, 1.1, EASE.linear);
  const v = EASE.outExpo(u);
  const dotX = PLOT.x + u * PLOT.w;
  const dotY = PLOT.y + PLOT.h - v * PLOT.h;
  const evolved = evolvePath(draw, CURVE_PATH);
  return (
    <>
      <svg
        width={1080}
        height={1920}
        style={{ position: "absolute", inset: 0, opacity: appear }}
      >
        <line
          x1={PLOT.x}
          x2={PLOT.x + PLOT.w}
          y1={PLOT.y + PLOT.h}
          y2={PLOT.y + PLOT.h}
          stroke={C.cream}
          strokeOpacity={0.35}
          strokeWidth={2}
        />
        <line
          x1={PLOT.x}
          x2={PLOT.x}
          y1={PLOT.y}
          y2={PLOT.y + PLOT.h}
          stroke={C.cream}
          strokeOpacity={0.35}
          strokeWidth={2}
        />
        <line
          x1={PLOT.x}
          x2={PLOT.x + PLOT.w}
          y1={PLOT.y}
          y2={PLOT.y}
          stroke={C.cream}
          strokeOpacity={0.12}
          strokeWidth={1.5}
          strokeDasharray="4 8"
        />
        <path
          d={CURVE_PATH}
          fill="none"
          stroke={C.cream}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={evolved.strokeDasharray}
          strokeDashoffset={evolved.strokeDashoffset}
        />
        {u > 0 ? (
          <>
            <line
              x1={dotX}
              x2={dotX}
              y1={dotY}
              y2={PLOT.y + PLOT.h}
              stroke={C.vermilion}
              strokeWidth={2}
              strokeOpacity={0.6}
            />
            <circle cx={dotX} cy={dotY} r={11} fill={C.vermilion} />
          </>
        ) : null}
      </svg>
      <div
        style={{
          position: "absolute",
          top: PLOT.y + PLOT.h + 22,
          left: PLOT.x,
          width: PLOT.w,
          display: "flex",
          justifyContent: "space-between",
          opacity: appear * 0.75,
        }}
      >
        <div
          style={{
            ...MONO_LABEL,
            fontSize: 20,
            letterSpacing: "0.12em",
            color: C.cream,
          }}
        >
          cubic-bezier(0.16, 1, 0.3, 1)
        </div>
        <div
          style={{
            ...MONO_LABEL,
            fontSize: 20,
            letterSpacing: "0.12em",
            color: C.vermilion,
          }}
        >
          {v.toFixed(3)}
        </div>
      </div>
    </>
  );
};

export const SwissGrid: React.FC<{ color: string; opacity: number }> = ({
  color,
  opacity,
}) => (
  <AbsoluteFill style={{ opacity }}>
    {Array.from({ length: 13 }, (_, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: 60 + i * 80,
          top: 0,
          width: 1,
          height: 1920,
          backgroundColor: color,
        }}
      />
    ))}
  </AbsoluteFill>
);

// 01 TYPE: "MOTION" drops in letter by letter on springs, "IS JUST" tracks
// in, "MATH." slams down on the beat, then slices apart and snaps back.
export const TypeChapter: React.FC<{ start: number }> = ({ start }) => {
  const t = useChapterTime(start);
  const { fps } = useVideoConfig();

  const isJust = prog(t, CUE.isJust, 0.6);
  const math = prog(t, CUE.math - 0.02, 0.4);
  const mathVisible = prog(t, CUE.math - 0.02, 0.06, EASE.linear);
  const sliceRaw =
    prog(t, CUE.slice - 0.05, 0.05, EASE.linear) * kick(t, CUE.slice, 0.13);
  // Snap fully back once the offset is under a pixel or so.
  const slice = sliceRaw < 0.012 ? 0 : sliceRaw;
  const drift = lerp(1, 1.04, prog(t, 0, 3, EASE.linear));

  const mathStyle: React.CSSProperties = {
    ...WIDE,
    fontSize: 172,
    color: C.vermilion,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <SwissGrid color={C.cream} opacity={0.07} />
      <AbsoluteFill style={{ transform: `scale(${drift})` }}>
        <div
          style={{
            position: "absolute",
            top: 530,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          {"MOTION".split("").map((ch, i) => {
            const s = spring({
              frame: Math.max(
                0,
                (t - CUE.lettersStart - i * CUE.letterStagger) * fps,
              ),
              fps,
              config: SPRING.snappy,
            });
            return (
              <span
                key={i}
                style={{
                  ...WIDE,
                  fontSize: 138,
                  color: C.cream,
                  display: "inline-block",
                  opacity: Math.min(1, s * 3),
                  transform: `translateY(${(1 - s) * -160}px) rotate(${(1 - s) * -16}deg)`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>

        <div
          style={{
            position: "absolute",
            top: 712,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              ...MONO_LABEL,
              fontSize: 44,
              fontWeight: 700,
              color: C.cream,
              opacity: isJust,
              letterSpacing: `${lerp(0.9, 0.5, isJust)}em`,
              marginRight: `-${lerp(0.9, 0.5, isJust)}em`,
            }}
          >
            is just
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: 810,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: mathVisible,
            transform: `scale(${lerp(1.9, 1, math)})`,
            filter: math < 1 ? `blur(${(1 - math) * 18}px)` : undefined,
          }}
        >
          {/* Rendered as horizontal slices so it can split apart and snap back. */}
          <div style={{ position: "relative" }}>
            <div style={{ ...mathStyle, visibility: "hidden" }}>MATH.</div>
            {SLICES.map((dir, i) => {
              const top = (i / SLICES.length) * 100;
              const bottom = 100 - ((i + 1) / SLICES.length) * 100;
              return (
                <div
                  key={i}
                  style={{
                    ...mathStyle,
                    position: "absolute",
                    inset: 0,
                    clipPath: `inset(${top}% -20% ${bottom}% -20%)`,
                    transform: `translateX(${dir * 110 * slice}px)`,
                  }}
                >
                  MATH.
                </div>
              );
            })}
          </div>
        </div>
        <EasingPlot t={t} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
