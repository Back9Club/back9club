import { lightLeak } from "@remotion/effects/light-leak";
import React from "react";
import { interpolate, Solid, useCurrentFrame, useVideoConfig } from "remotion";

// Warm light leak that blooms in and retracts. Place it in a
// <TransitionSeries.Overlay> to dress up a hard cut without shortening the
// timeline, or on top of any scene. Uses WebGL2.
export const LightLeakOverlay: React.FC<{
  seed?: number;
  /** 0 = yellow/orange, 120 = green, 240 = blue. */
  hueShift?: number;
}> = ({ seed = 0, hueShift = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, height, width } = useVideoConfig();

  return (
    <Solid
      width={width}
      height={height}
      effects={[
        lightLeak({
          seed,
          hueShift,
          progress: interpolate(frame, [0, durationInFrames - 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }),
      ]}
    />
  );
};
