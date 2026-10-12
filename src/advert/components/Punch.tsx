import React from "react";
import { interpolate } from "remotion";
import { lerp } from "../../teaser/components/time";
import { FPS } from "../timeline";
import { snap } from "./kinetics";

/**
 * A word that slams into place on a hit: it arrives oversized and blurred,
 * lands within three frames, squashes slightly past its size and settles.
 */
export const Punch: React.FC<{
  t: number;
  at: number;
  /** Starting scale. */
  from?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ t, at, from = 1.5, children, style }) => {
  const s = snap(t, at);
  const scale = lerp(from, 1, s);
  const speed = Math.abs(scale - lerp(from, 1, snap(t - 1 / FPS, at)));
  const blur = Math.min(5, speed * 20);
  const opacity = interpolate(t - at, [0, 1.5 / FPS], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        display: "inline-block",
        transform: `scale(${scale})`,
        opacity,
        filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
