import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { EASE } from "../../motion/easing";
import { prog } from "../../teaser/components/time";
import { useChapterTime } from "../time";
import { C, WIDE } from "../theme";
import { CUE } from "../timeline";
import { TITLE_TOP } from "../layout";

const S = 118; // cubelet size
const CENTER_Y = 740;

type Shade = { top: string; front: string; side: string; edge: string };

const INK: Shade = {
  top: "#3A3A44",
  front: "#1C1C23",
  side: "#0B0B0F",
  edge: "rgba(245,241,232,0.16)",
};
const RED: Shade = {
  top: "#FF7E63",
  front: "#FF4D2E",
  side: "#D23A1E",
  edge: "rgba(255,255,255,0.25)",
};

// The six faces of one cubelet, lit from the top-front.
const FACES: { transform: string; tone: keyof Shade }[] = [
  { transform: `translateZ(${S / 2}px)`, tone: "front" },
  { transform: `rotateY(180deg) translateZ(${S / 2}px)`, tone: "side" },
  { transform: `rotateY(90deg) translateZ(${S / 2}px)`, tone: "side" },
  { transform: `rotateY(-90deg) translateZ(${S / 2}px)`, tone: "front" },
  { transform: `rotateX(90deg) translateZ(${S / 2}px)`, tone: "top" },
  { transform: `rotateX(-90deg) translateZ(${S / 2}px)`, tone: "side" },
];

const CUBELETS = (() => {
  const out: { x: number; y: number; z: number; k: number }[] = [];
  let k = 0;
  for (let y = -1; y <= 1; y++)
    for (let z = -1; z <= 1; z++)
      for (let x = -1; x <= 1; x++) out.push({ x, y, z, k: k++ });
  return out;
})();

// 03 DEPTH: a 3x3x3 cube assembles from flying blocks, bursts apart on the
// beat with each block spinning, then snaps back together, all while the
// camera orbits. Real CSS 3D (162 faces), lit per face.
export const DepthChapter: React.FC<{ start: number }> = ({ start }) => {
  const t = useChapterTime(start);
  const { fps } = useVideoConfig();

  const orbit = interpolate(
    t,
    [CUE.cubeIn - 0.4, CUE.cubeIn + 3.2],
    [-40, 150],
    {
      easing: EASE.inOutSine,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const springAt = (
    cue: number,
    config: { damping: number; stiffness: number; mass?: number },
  ) => spring({ frame: Math.max(0, (t - cue) * fps), fps, config });
  const explode =
    springAt(CUE.cubeExplode, { damping: 13, stiffness: 120 }) *
    (1 - springAt(CUE.cubeRejoin, { damping: 16, stiffness: 170 }));
  const label = prog(t, CUE.cubeIn + 0.3, 0.7);
  const shadow = 1 + explode * 0.6;

  return (
    <AbsoluteFill style={{ backgroundColor: C.cream }}>
      <div
        style={{
          position: "absolute",
          left: 540 - 300 * shadow,
          top: CENTER_Y + 330,
          width: 600 * shadow,
          height: 90,
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(11,11,15,0.28), rgba(11,11,15,0))",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 540,
          top: CENTER_Y,
          perspective: 1700,
          transformStyle: "preserve-3d",
        }}
      >
        <div
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(-24deg) rotateY(${orbit}deg)`,
          }}
        >
          {CUBELETS.map(({ x, y, z, k }) => {
            const arrive = prog(t, CUE.cubeIn + k * 0.012, 0.65, EASE.outExpo);
            const spread = (1 - arrive) * 3.2 + explode * 0.8;
            const step = S * (1 + spread);
            const spin = explode * 90 * (((x + y + z + 3) % 2) * 2 - 1);
            const shade = y === 0 ? RED : INK;
            return (
              <div
                key={k}
                style={{
                  position: "absolute",
                  // Sized like a face so it spins about its own centre.
                  width: S,
                  height: S,
                  transformStyle: "preserve-3d",
                  opacity: Math.min(1, arrive * 4),
                  transform: `translate3d(${x * step - S / 2}px, ${y * step - S / 2 - (1 - arrive) * 500}px, ${z * step}px) rotateY(${spin}deg) rotateX(${spin * 0.5}deg)`,
                }}
              >
                {FACES.map((face, f) => (
                  <div
                    key={f}
                    style={{
                      position: "absolute",
                      width: S,
                      height: S,
                      backgroundColor: shade[face.tone],
                      boxShadow: `inset 0 0 0 1.5px ${shade.edge}`,
                      transform: face.transform,
                      backfaceVisibility: "hidden",
                    }}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: TITLE_TOP,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          overflow: "hidden",
          height: 180,
        }}
      >
        <div
          style={{
            ...WIDE,
            fontSize: 166,
            color: C.ink,
            transform: `translateY(${(1 - label) * 105}%)`,
          }}
        >
          DEPTH
        </div>
      </div>
    </AbsoluteFill>
  );
};
