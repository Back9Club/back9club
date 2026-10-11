import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { GRAIN_TILE } from "../../components/Background";

// Living film grain: the static noise tile jumps to a new (deterministic)
// offset every frame, like real grain, at a fraction of the cost of
// regenerating noise.
export const FilmGrain: React.FC<{ opacity?: number }> = ({
  opacity = 0.09,
}) => {
  const frame = useCurrentFrame();
  const x = Math.floor(random(`grain-x-${frame}`) * 256);
  const y = Math.floor(random(`grain-y-${frame}`) * 256);
  return (
    <AbsoluteFill
      style={{
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
        backgroundImage: GRAIN_TILE,
        backgroundSize: "256px 256px",
        backgroundPosition: `${x}px ${y}px`,
      }}
    />
  );
};
