import React from "react";
import { AbsoluteFill } from "remotion";
import { EASE } from "../../motion/easing";
import { kick, lerp, prog } from "../../teaser/components/time";
import { useChapterTime } from "../time";
import { C, MONO_LABEL, WIDE } from "../theme";
import { BEAT, CUE } from "../timeline";

const RAYS = 48;
const RAY_COLORS = [C.vermilion, C.blue, C.yellow, C.cream];
const BX = 540;
const BY = 840;

const STATS = [
  { value: "15", label: "Seconds", cue: CUE.stat1, color: C.cream },
  { value: "0", label: "Keyframes", cue: CUE.stat2, color: C.cream },
  { value: "100%", label: "Code", cue: CUE.stat3, color: C.vermilion },
];

// 05 FINALE: a starburst of rays fires out of the iris and flies apart, rings
// pulse on the beat, then three stats slam in on the downbeats.
export const FinaleChapter: React.FC<{ start: number }> = ({ start }) => {
  const t = useChapterTime(start);
  const credit = prog(t, CUE.credit, 0.6);
  const hit = kick(t, CUE.stat3, 0.3);

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <svg
        width={1080}
        height={1920}
        style={{ position: "absolute", inset: 0 }}
      >
        {Array.from({ length: RAYS }, (_, i) => {
          const a = (i / RAYS) * Math.PI * 2 + 0.2;
          const outer =
            1350 * prog(t, CUE.burst + (i % 6) * 0.018, 0.55, EASE.outExpo);
          const inner =
            1350 *
            prog(t, CUE.burst + 0.28 + (i % 4) * 0.03, 0.65, EASE.inOutCubic);
          if (outer - inner < 1) return null;
          return (
            <line
              key={i}
              x1={BX + Math.cos(a) * inner}
              y1={BY + Math.sin(a) * inner}
              x2={BX + Math.cos(a) * outer}
              y2={BY + Math.sin(a) * outer}
              stroke={RAY_COLORS[i % RAY_COLORS.length]}
              strokeWidth={i % 3 === 0 ? 9 : 4}
              strokeLinecap="round"
            />
          );
        })}
        {[0, 1, 2].map((k) => {
          const p = prog(t, CUE.burst + k * BEAT, 0.9, EASE.outCubic);
          return p > 0 && p < 1 ? (
            <circle
              key={k}
              cx={BX}
              cy={BY}
              r={60 + 900 * p}
              fill="none"
              stroke={C.cream}
              strokeWidth={3}
              strokeOpacity={0.6 * (1 - p)}
            />
          ) : null;
        })}
      </svg>

      <div
        style={{
          position: "absolute",
          top: 470,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 36,
          transform: `scale(${1 + 0.02 * hit})`,
        }}
      >
        {STATS.map(({ value, label, cue, color }) => {
          const p = prog(t, cue - 0.02, 0.38);
          const visible = prog(t, cue - 0.02, 0.06, EASE.linear);
          const sub = prog(t, cue + 0.08, 0.5);
          return (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  ...WIDE,
                  fontSize: 168,
                  color,
                  opacity: visible,
                  transform: `scale(${lerp(1.7, 1, p)})`,
                  filter: p < 1 ? `blur(${(1 - p) * 16}px)` : undefined,
                }}
              >
                {value}
              </div>
              <div
                style={{
                  ...MONO_LABEL,
                  fontSize: 30,
                  fontWeight: 700,
                  color: C.cream,
                  opacity: sub,
                  letterSpacing: `${lerp(0.8, 0.45, sub)}em`,
                  marginRight: `-${lerp(0.8, 0.45, sub)}em`,
                }}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          top: 1300,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            ...MONO_LABEL,
            fontSize: 22,
            color: C.cream,
            opacity: 0.55 * credit,
          }}
        >
          Remotion · React · Python audio
        </div>
      </div>
    </AbsoluteFill>
  );
};
