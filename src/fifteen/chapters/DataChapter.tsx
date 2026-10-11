import { evolvePath } from "@remotion/paths";
import React from "react";
import { AbsoluteFill, spring, useVideoConfig } from "remotion";
import { EASE } from "../../motion/easing";
import { prog } from "../../teaser/components/time";
import { useChapterTime } from "../time";
import { C, MONO_LABEL, WIDE } from "../theme";
import { CUE } from "../timeline";
import { TITLE_TOP } from "../layout";

const BARS = [0.34, 0.47, 0.41, 0.62, 0.7, 0.66, 0.94];
const TREND = [0.22, 0.3, 0.38, 0.47, 0.6, 0.74, 0.9];
const LEFT = 190;
const WIDTH = 700;
const BAR_W = 64;
const GAP = (WIDTH - BARS.length * BAR_W) / (BARS.length - 1);
const BASE = 1105;
const HEIGHT = 470;

const barX = (i: number) => LEFT + i * (BAR_W + GAP);
const TREND_POINTS = TREND.map((v, i) => [
  barX(i) + BAR_W / 2,
  BASE - v * HEIGHT - 70,
]);
const TREND_PATH = TREND_POINTS.map(
  ([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`,
).join(" ");

// 04 DATA: a counter races up, gridlines draw on, bars spring up on the
// 16ths, and a trend line draws itself across them.
export const DataChapter: React.FC<{ start: number }> = ({ start }) => {
  const t = useChapterTime(start);
  const { fps } = useVideoConfig();

  const count = prog(
    t,
    CUE.countStart,
    CUE.countEnd - CUE.countStart,
    EASE.outExpo,
  );
  const counterIn = prog(t, CUE.countStart - 0.1, 0.5);
  const gridDraw = prog(t, CUE.countStart, 0.6, EASE.inOutCubic);
  const line = prog(t, CUE.lineDraw, 0.75, EASE.inOutCubic);
  const label = prog(t, CUE.countStart + 0.25, 0.7);
  const evolved = evolvePath(line, TREND_PATH);

  return (
    <AbsoluteFill style={{ backgroundColor: C.blue }}>
      <div
        style={{
          position: "absolute",
          top: 350,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
          opacity: counterIn,
          transform: `translateY(${(1 - counterIn) * 40}px)`,
        }}
      >
        <div
          style={{
            ...WIDE,
            fontSize: 168,
            color: C.cream,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          +{Math.round(248 * count)}
          <span style={{ color: C.yellow }}>%</span>
        </div>
        <div
          style={{ ...MONO_LABEL, fontSize: 24, color: C.cream, opacity: 0.75 }}
        >
          Every number, animated
        </div>
      </div>

      <svg
        width={1080}
        height={1920}
        style={{ position: "absolute", inset: 0 }}
      >
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1={LEFT - 20}
            x2={LEFT - 20 + (WIDTH + 40) * gridDraw}
            y1={BASE - g * HEIGHT}
            y2={BASE - g * HEIGHT}
            stroke={C.cream}
            strokeOpacity={0.18}
            strokeWidth={1.5}
          />
        ))}
        <line
          x1={LEFT - 20}
          x2={LEFT - 20 + (WIDTH + 40) * gridDraw}
          y1={BASE}
          y2={BASE}
          stroke={C.cream}
          strokeWidth={3}
        />
        {BARS.map((v, i) => {
          const grow = spring({
            frame: Math.max(0, (t - CUE.barsStart - i * CUE.barStagger) * fps),
            fps,
            config: { damping: 14, stiffness: 140 },
          });
          const h = v * HEIGHT * grow;
          return (
            <rect
              key={i}
              x={barX(i)}
              y={BASE - h}
              width={BAR_W}
              height={h}
              rx={6}
              fill={i === BARS.length - 1 ? C.yellow : C.cream}
            />
          );
        })}
        <path
          d={TREND_PATH}
          fill="none"
          stroke={C.yellow}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={evolved.strokeDasharray}
          strokeDashoffset={evolved.strokeDashoffset}
        />
        {TREND_POINTS.map(([x, y], i) => {
          const pop = prog(
            t,
            CUE.lineDraw + (i / (TREND_POINTS.length - 1)) * 0.75 - 0.05,
            0.3,
            EASE.outBack,
          );
          return pop > 0 ? (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={13 * pop}
              fill={C.blue}
              stroke={C.yellow}
              strokeWidth={5}
            />
          ) : null;
        })}
      </svg>

      <div
        style={{
          position: "absolute",
          top: TITLE_TOP,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          overflow: "hidden",
          height: 210,
        }}
      >
        <div
          style={{
            ...WIDE,
            fontSize: 200,
            color: C.cream,
            transform: `translateY(${(1 - label) * 105}%)`,
          }}
        >
          DATA
        </div>
      </div>
    </AbsoluteFill>
  );
};
