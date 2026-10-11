import { noise3D } from "@remotion/noise";
import React, { useMemo } from "react";
import { INK } from "../theme";

const W = 1080;
const H = 1920;
const CELL = 18;
const COLS = Math.ceil(W / CELL);
const ROWS = Math.ceil(H / CELL);
const LEVELS = 18;

// Marching-squares edge pairs for each of the 16 corner cases.
// Edges: 0 top, 1 right, 2 bottom, 3 left.
const CASES: number[][] = [
  [],
  [3, 2],
  [2, 1],
  [3, 1],
  [0, 1],
  [3, 0, 2, 1],
  [0, 2],
  [3, 0],
  [3, 0],
  [0, 2],
  [0, 3, 1, 2],
  [0, 1],
  [3, 1],
  [2, 1],
  [3, 2],
  [],
];

const field = (x: number, y: number, z: number) =>
  noise3D("green", x * 0.0016, y * 0.0016, z) * 0.78 +
  noise3D("green-detail", x * 0.0045, y * 0.0045, z * 1.6) * 0.22;

// Animated topographic contours, like the reading of a putting green.
// Fully procedural (noise -> marching squares), recomputed every frame.
export const ContourField: React.FC<{
  t: number;
  opacity: number;
  /** Extra brightness 0..1 (e.g. on an impact). */
  pulse?: number;
  /** Vertical drift in px (parallax with the camera). */
  driftY?: number;
}> = ({ t, opacity, pulse = 0, driftY = 0 }) => {
  const z = t * 0.09;
  const [minor, major] = useMemo(() => {
    const v = new Float32Array((COLS + 1) * (ROWS + 1));
    for (let j = 0; j <= ROWS; j++) {
      for (let i = 0; i <= COLS; i++) {
        v[j * (COLS + 1) + i] = field(i * CELL, j * CELL + driftY, z);
      }
    }
    const paths = ["", ""];
    for (let l = 0; l < LEVELS; l++) {
      const level = -0.8 + (1.6 * (l + 0.5)) / LEVELS;
      let d = "";
      for (let j = 0; j < ROWS; j++) {
        for (let i = 0; i < COLS; i++) {
          const a = v[j * (COLS + 1) + i];
          const b = v[j * (COLS + 1) + i + 1];
          const c = v[(j + 1) * (COLS + 1) + i + 1];
          const e = v[(j + 1) * (COLS + 1) + i];
          const idx =
            (a > level ? 8 : 0) |
            (b > level ? 4 : 0) |
            (c > level ? 2 : 0) |
            (e > level ? 1 : 0);
          const edges = CASES[idx];
          if (edges.length === 0) continue;
          const x0 = i * CELL;
          const y0 = j * CELL;
          const pt = (edge: number): [number, number] => {
            switch (edge) {
              case 0:
                return [x0 + (CELL * (level - a)) / (b - a), y0];
              case 1:
                return [x0 + CELL, y0 + (CELL * (level - b)) / (c - b)];
              case 2:
                return [x0 + (CELL * (level - e)) / (c - e), y0 + CELL];
              default:
                return [x0, y0 + (CELL * (level - a)) / (e - a)];
            }
          };
          for (let k = 0; k < edges.length; k += 2) {
            const [x1, y1] = pt(edges[k]);
            const [x2, y2] = pt(edges[k + 1]);
            d += `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
          }
        }
      }
      paths[l % 4 === 1 ? 1 : 0] += d;
    }
    return paths;
  }, [z, driftY]);

  const mask =
    "radial-gradient(75% 55% at 50% 50%, black 0%, rgba(0,0,0,0.75) 45%, transparent 100%)";

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    >
      <path
        d={minor}
        fill="none"
        stroke={INK.green}
        strokeOpacity={0.32 + 0.3 * pulse}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      <path
        d={major}
        fill="none"
        stroke={INK.green}
        strokeOpacity={0.6 + 0.35 * pulse}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </svg>
  );
};
