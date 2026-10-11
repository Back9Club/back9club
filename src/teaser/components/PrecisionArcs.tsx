import React, { useId } from "react";
import { EASE } from "../../motion/easing";
import { INK } from "../theme";
import { prog } from "./time";

type Ring = {
  r: number;
  width: number;
  /** Fraction of the circle drawn. */
  frac: number;
  /** Resting angle (deg, 0 = 3 o'clock). */
  rest: number;
  /** Extra rotation (deg) unwound while the ring settles. */
  spin: number;
  /** Slow drift after landing (deg/s). */
  drift: number;
  stroke: string;
  opacity: number;
  dash?: string;
};

const RINGS: Ring[] = [
  {
    r: 440,
    width: 1.5,
    frac: 1,
    rest: -90,
    spin: 0,
    drift: 0,
    stroke: INK.white,
    opacity: 0.2,
  },
  {
    r: 404,
    width: 3.5,
    frac: 0.26,
    rest: -137,
    spin: 300,
    drift: 5,
    stroke: INK.green,
    opacity: 1,
  },
  {
    r: 380,
    width: 1.5,
    frac: 0.6,
    rest: 150,
    spin: -220,
    drift: -3,
    stroke: "steel",
    opacity: 0.75,
  },
  {
    r: 352,
    width: 1,
    frac: 0.86,
    rest: 210,
    spin: 170,
    drift: 2,
    stroke: INK.white,
    opacity: 0.22,
    dash: "2 7",
  },
  {
    r: 322,
    width: 7,
    frac: 0.05,
    rest: -98,
    spin: -320,
    drift: -6,
    stroke: INK.white,
    opacity: 0.9,
  },
  {
    r: 300,
    width: 1,
    frac: 1,
    rest: -90,
    spin: 0,
    drift: 0,
    stroke: INK.white,
    opacity: 0.09,
  },
];

const TICKS = 120;

// Launch-monitor-style dial built from precision arcs. Rings draw on and spin
// down to rest exactly at `land`, then drift. `exit` (0..1) flies them out
// past the camera at different rates for the expanding-circle transition.
export const PrecisionArcs: React.FC<{
  t: number;
  start: number;
  land: number;
  exit: number;
  cx?: number;
  cy?: number;
}> = ({ t, start, land, exit, cx = 540, cy = 860 }) => {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const settle = land - start;
  const converge = prog(t, start, settle, EASE.outExpo);
  const flash = t >= land ? Math.exp(-(t - land) / 0.25) : 0;
  const tickReveal = prog(t, start, settle * 0.9, EASE.inOutCubic);

  return (
    <svg
      width={1080}
      height={1920}
      viewBox="0 0 1080 1920"
      style={{ position: "absolute", inset: 0, overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`steel-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={INK.steel} />
          <stop offset="50%" stopColor={INK.steelLight} />
          <stop offset="100%" stopColor={INK.steel} />
        </linearGradient>
      </defs>
      <g
        transform={`translate(${cx} ${cy}) scale(${1.1 - 0.1 * converge})`}
        opacity={1 - exit}
      >
        {RINGS.map((ring, i) => {
          const p = prog(t, start + i * 0.05, settle - i * 0.05, EASE.outExpo);
          const c = 2 * Math.PI * ring.r;
          const angle =
            ring.rest +
            ring.spin * (1 - p) +
            ring.drift * Math.max(0, t - land);
          const ringScale = 1 + exit * (1.6 + i * 0.45);
          return (
            <g key={i} transform={`scale(${ringScale}) rotate(${angle})`}>
              <circle
                r={ring.r}
                fill="none"
                stroke={
                  ring.stroke === "steel" ? `url(#steel-${id})` : ring.stroke
                }
                strokeWidth={ring.width}
                strokeOpacity={Math.min(1, ring.opacity * (1 + flash * 0.8))}
                strokeDasharray={ring.dash ?? `${ring.frac * c * p} ${c}`}
                strokeLinecap={ring.width > 3 ? "round" : "butt"}
              />
            </g>
          );
        })}
        <g
          transform={`scale(${1 + exit * 1.3}) rotate(${-90 + 4 * Math.max(0, t - land)})`}
        >
          {Array.from({ length: TICKS }, (_, k) => {
            if (k / TICKS > tickReveal) return null;
            const major = k % 10 === 0;
            const a = (k / TICKS) * 2 * Math.PI;
            const r0 = 458;
            const r1 = r0 + (major ? 22 : 9);
            return (
              <line
                key={k}
                x1={Math.cos(a) * r0}
                y1={Math.sin(a) * r0}
                x2={Math.cos(a) * r1}
                y2={Math.sin(a) * r1}
                stroke={major ? INK.white : INK.steel}
                strokeOpacity={major ? 0.6 : 0.3}
                strokeWidth={major ? 2 : 1}
              />
            );
          })}
        </g>
      </g>
    </svg>
  );
};
