import { noise3D } from "@remotion/noise";
import React, { useId } from "react";
import { AbsoluteFill } from "remotion";
import { EASE } from "../../motion/easing";
import { prog } from "../../teaser/components/time";
import { useChapterTime } from "../time";
import { C, WIDE } from "../theme";
import { CUE } from "../timeline";
import { TITLE_TOP } from "../layout";

const COLS = 7;
const ROWS = 8;
const PITCH = 106;
const SIZE = 58;
const CX = 540;
const CY = 760;
const BLOB_POINTS = 72;

// Smooth closed path through points (Catmull-Rom converted to cubic Bezier).
const smoothPath = (pts: [number, number][]) => {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return `${d}Z`;
};

// Organic, breathing blob: a circle whose radius is pushed around by noise.
const blobPath = (t: number, radius: number) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < BLOB_POINTS; i++) {
    const a = (i / BLOB_POINTS) * Math.PI * 2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const r =
      radius *
      (1 +
        0.17 * noise3D("blob", ca * 0.9, sa * 0.9, t * 0.75) +
        0.06 * noise3D("blob-fine", ca * 2.2, sa * 2.2, t * 1.3));
    pts.push([CX + 40 * Math.sin(t * 1.3) + ca * r, CY + sa * r]);
  }
  return smoothPath(pts);
};

// 02 FORM: a grid of shapes travels in a wave from circles to squares to
// diamonds and back, while a liquid blob breathes through the middle. Inside
// the blob the grid inverts.
export const FormChapter: React.FC<{ start: number }> = ({ start }) => {
  const t = useChapterTime(start);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const blobIn = prog(t, CUE.gridIn + 0.05, 0.8);
  const blob = blobPath(t, 250 * blobIn);
  const label = prog(t, CUE.gridIn + 0.35, 0.7);

  const shapes: {
    key: string;
    x: number;
    y: number;
    s: number;
    rx: number;
    rot: number;
  }[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = CX + (c - (COLS - 1) / 2) * PITCH;
      const y = CY + (r - (ROWS - 1) / 2) * PITCH;
      const delay = Math.hypot(c - (COLS - 1) / 2, r - (ROWS - 1) / 2) * 0.045;
      const appear = prog(t, CUE.gridIn + delay, 0.5, EASE.outBack);
      const ripple = prog(t, CUE.gridRipple + delay, 0.5, EASE.inOutCubic);
      const square =
        prog(t, CUE.gridSquare + delay, 0.4, EASE.inOutCubic) * (1 - ripple);
      const rot =
        45 * prog(t, CUE.gridDiamond + delay, 0.45, EASE.inOutCubic) +
        45 * ripple;
      const scale =
        appear *
        (1 -
          0.55 *
            Math.sin(
              Math.PI * prog(t, CUE.gridRipple + delay, 0.6, EASE.inOutSine),
            ));
      const s = SIZE * scale;
      shapes.push({
        key: `${r}-${c}`,
        x,
        y,
        s,
        rx: (s / 2) * (1 - square),
        rot,
      });
    }
  }

  const grid = (fill: string) =>
    shapes.map(({ key, x, y, s, rx, rot }) =>
      s > 0.5 ? (
        <rect
          key={key}
          x={x - s / 2}
          y={y - s / 2}
          width={s}
          height={s}
          rx={rx}
          fill={fill}
          transform={`rotate(${rot} ${x} ${y})`}
        />
      ) : null,
    );

  return (
    <AbsoluteFill style={{ backgroundColor: C.vermilion }}>
      <svg
        width={1080}
        height={1920}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <clipPath id={`in-${id}`}>
            <path d={blob} />
          </clipPath>
          <mask id={`out-${id}`} maskUnits="userSpaceOnUse">
            <rect width={1080} height={1920} fill="white" />
            <path d={blob} fill="black" />
          </mask>
        </defs>
        <g mask={`url(#out-${id})`}>{grid(C.cream)}</g>
        <path d={blob} fill={C.ink} />
        <g clipPath={`url(#in-${id})`}>{grid(C.vermilion)}</g>
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
          height: 200,
        }}
      >
        <div
          style={{
            ...WIDE,
            fontSize: 190,
            color: C.ink,
            transform: `translateY(${(1 - label) * 105}%)`,
          }}
        >
          FORM
        </div>
      </div>
    </AbsoluteFill>
  );
};
