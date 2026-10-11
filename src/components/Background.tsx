import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../theme";

// Vertical gradient with a soft glow that drifts slowly over the scene.
// Colors must be 6-digit hex (#RRGGBB).
export const Background: React.FC<{
  top?: string;
  bottom?: string;
  glow?: string;
}> = ({ top = COLORS.fairway, bottom = COLORS.ink, glow = COLORS.green }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const glowY = interpolate(frame, [0, durationInFrames], [28, 38]);

  return (
    <AbsoluteFill
      style={{
        background: [
          `radial-gradient(110% 60% at 50% ${glowY}%, ${glow}66 0%, ${glow}00 70%)`,
          `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`,
        ].join(", "),
      }}
    >
      <Grain />
    </AbsoluteFill>
  );
};

// Fine static film grain. Dithers gradients so they don't band after
// Instagram / TikTok re-compress the video. The noise is an SVG tile used as a
// background image, so Chrome rasterizes it once instead of on every frame.
export const GRAIN_TILE = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">' +
    '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>' +
    '<feColorMatrix type="saturate" values="0"/></filter>' +
    '<rect width="100%" height="100%" filter="url(#n)"/></svg>',
)}")`;

export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.07 }) => (
  <AbsoluteFill
    style={{
      opacity,
      mixBlendMode: "overlay",
      pointerEvents: "none",
      backgroundImage: GRAIN_TILE,
      backgroundSize: "256px 256px",
    }}
  />
);
