import React from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { SAFE_AREA } from "../config";
import { EASE } from "../motion/easing";
import { prog } from "../teaser/components/time";
import { C, MONO_LABEL } from "./theme";
import { CUTS, DURATION_IN_FRAMES, FPS } from "./timeline";

const LABELS = ["TYPE", "FORM", "DEPTH", "DATA", "CODE"];
// Foreground colour of each chapter, so the HUD stays legible on all of them.
const FG = [C.cream, C.ink, C.ink, C.cream, C.cream];

const BAR_LEFT = 140;
const BAR_WIDTH = 800;
const TOP = SAFE_AREA.top + 8;
const BOTTOM = 1920 - SAFE_AREA.bottom - 30;

// Overlay that runs across every chapter: a precision countdown from 15.00 to
// 0.00, a progress rail, and the current chapter, which ticks over at each cut.
export const Hud: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const last = DURATION_IN_FRAMES - 1;
  // 15.00 on the first frame, 0.00 on the last.
  const remaining = (15 * (last - frame)) / last;

  // Crossfade the colour over 0.24s around each cut.
  const fg = interpolateColors(
    t,
    CUTS.flatMap((cut) => [cut - 0.12, cut + 0.12]),
    CUTS.flatMap((_, k) => [FG[k], FG[k + 1]]),
  );

  const chapter = CUTS.filter((cut) => t >= cut).length;
  const sinceCut = chapter === 0 ? t : t - CUTS[chapter - 1];
  const labelIn = chapter === 0 ? prog(t, 0.1, 0.5) : prog(sinceCut, 0, 0.45);
  const intro = prog(t, 0.05, 0.6, EASE.outCubic);

  return (
    <AbsoluteFill style={{ pointerEvents: "none", color: fg }}>
      <div
        style={{
          position: "absolute",
          top: TOP,
          left: BAR_LEFT,
          width: BAR_WIDTH,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: intro,
        }}
      >
        <div style={{ ...MONO_LABEL, fontSize: 24 }}>Fifteen</div>
        <div
          style={{
            ...MONO_LABEL,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}
        >
          {remaining.toFixed(2)}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: BOTTOM - 54,
          left: BAR_LEFT,
          width: BAR_WIDTH,
          display: "flex",
          justifyContent: "space-between",
          opacity: intro,
        }}
      >
        <div style={{ overflow: "hidden", height: 30 }}>
          <div
            style={{
              ...MONO_LABEL,
              fontSize: 24,
              transform: `translateY(${(1 - labelIn) * 100}%)`,
            }}
          >
            {String(chapter + 1).padStart(2, "0")} · {LABELS[chapter]}
          </div>
        </div>
        <div style={{ ...MONO_LABEL, fontSize: 24, opacity: 0.6 }}>
          {String(chapter + 1).padStart(2, "0")}/05
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: BOTTOM,
          left: BAR_LEFT,
          width: BAR_WIDTH * intro,
          height: 3,
          backgroundColor: fg,
          opacity: 0.22,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: BOTTOM - 1,
          left: BAR_LEFT,
          width: BAR_WIDTH * (frame / last),
          height: 5,
          backgroundColor: fg,
        }}
      />
      {CUTS.map((cut) => (
        <div
          key={cut}
          style={{
            position: "absolute",
            top: BOTTOM - 7,
            left: BAR_LEFT + BAR_WIDTH * (cut / 15) - 1,
            width: 2,
            height: 17,
            backgroundColor: fg,
            opacity: 0.5 * intro,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
