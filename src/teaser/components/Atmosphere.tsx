import React from "react";
import { AbsoluteFill } from "remotion";
import { INK } from "../theme";

export type AtmosphereState = {
  /** 0..1 strength of the forest-green glow behind the action. */
  glow: number;
  /** Glow centre, in % of the frame. */
  glowX: number;
  glowY: number;
  /** 0..1 strength of the light beams. */
  beams: number;
  /** Seconds, drives the slow beam drift. */
  t: number;
};

const Beam: React.FC<{
  x: number;
  angle: number;
  width: number;
  opacity: number;
}> = ({ x, angle, width, opacity }) => (
  <div
    style={{
      position: "absolute",
      left: x - width / 2,
      top: -700,
      width,
      height: 3300,
      transform: `rotate(${angle}deg)`,
      transformOrigin: "50% 50%",
      opacity,
      background: `linear-gradient(90deg, rgba(244,245,240,0) 0%, rgba(214,232,222,0.10) 42%, rgba(244,245,240,0.16) 50%, rgba(214,232,222,0.10) 58%, rgba(244,245,240,0) 100%)`,
      mixBlendMode: "screen",
    }}
  />
);

// Deep-black stage: soft forest glow, slow moving light beams and a vignette.
export const Atmosphere: React.FC<AtmosphereState> = ({
  glow,
  glowX,
  glowY,
  beams,
  t,
}) => (
  <AbsoluteFill style={{ backgroundColor: INK.black }}>
    <AbsoluteFill
      style={{
        opacity: glow,
        background: `radial-gradient(70% 42% at ${glowX}% ${glowY}%, rgba(35,139,87,0.34) 0%, rgba(16,42,32,0.55) 38%, rgba(9,13,11,0) 78%)`,
      }}
    />
    {beams > 0.001 ? (
      <>
        <Beam
          x={250 + 70 * Math.sin(t * 0.35)}
          angle={18 + 3 * Math.sin(t * 0.21)}
          width={300}
          opacity={beams * 0.9}
        />
        <Beam
          x={720 + 90 * Math.sin(t * 0.27 + 1.3)}
          angle={24 + 2 * Math.sin(t * 0.3 + 0.6)}
          width={180}
          opacity={beams * 0.6}
        />
        <Beam
          x={980 + 60 * Math.sin(t * 0.4 + 2.1)}
          angle={14}
          width={420}
          opacity={beams * 0.35}
        />
      </>
    ) : null}
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(120% 75% at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 85%, rgba(0,0,0,0.8) 100%)",
      }}
    />
  </AbsoluteFill>
);
