import { getLength, getPointAtLength } from "@remotion/paths";
import React, { useId, useMemo } from "react";
import { INK } from "../theme";

const SEGMENTS = 14;

// A golf-ball flight drawn along an SVG path: a glowing ball at the head and a
// tapering, fading trail behind it. Optionally leaves a faint trace of the
// whole flight already travelled.
export const Trajectory: React.FC<{
  d: string;
  /** 0..1 position of the ball along the path. */
  progress: number;
  /** Trail length as a fraction of the path. */
  trail?: number;
  color?: string;
  width?: number;
  /** Opacity of the line already travelled (behind the trail). */
  trace?: number;
  /** 0..1 visibility of the ball and trail. */
  opacity?: number;
  ballRadius?: number;
}> = ({
  d,
  progress,
  trail = 0.35,
  color = INK.green,
  width = 4,
  trace = 0.18,
  opacity = 1,
  ballRadius = 7,
}) => {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const length = useMemo(() => getLength(d), [d]);
  const head = Math.max(0, Math.min(1, progress)) * length;
  const tail = Math.max(0, head - trail * length);
  const ball = getPointAtLength(d, Math.max(head, 0.001));
  const segLen = (head - tail) / SEGMENTS;

  return (
    <svg
      width={1080}
      height={1920}
      viewBox="0 0 1080 1920"
      style={{ position: "absolute", inset: 0, overflow: "visible" }}
    >
      <defs>
        <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={`ball-${id}`}>
          <stop offset="0%" stopColor={INK.white} stopOpacity="1" />
          <stop offset="35%" stopColor={INK.white} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      {trace > 0 && head > 0 ? (
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={width * 0.4}
          strokeOpacity={trace * opacity}
          strokeDasharray={`${head} ${length}`}
          strokeLinecap="round"
        />
      ) : null}
      <g filter={`url(#glow-${id})`} opacity={opacity}>
        {segLen > 0
          ? Array.from({ length: SEGMENTS }, (_, i) => {
              const start = tail + i * segLen;
              const k = (i + 1) / SEGMENTS;
              return (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={width * (0.35 + 0.65 * k)}
                  strokeOpacity={k * k}
                  strokeLinecap="round"
                  strokeDasharray={`${segLen + 0.5} ${length * 2}`}
                  strokeDashoffset={-start}
                />
              );
            })
          : null}
      </g>
      {ball && progress > 0 && progress < 1 ? (
        <circle
          cx={ball.x}
          cy={ball.y}
          r={ballRadius * 3}
          fill={`url(#ball-${id})`}
          opacity={opacity}
        />
      ) : null}
    </svg>
  );
};
