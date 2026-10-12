import { noise2D } from "@remotion/noise";
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { EASE } from "../motion/easing";
import { GolfBall3D, type BallShot as Shot } from "./components/GolfBall3D";
import { CUE, FPS } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** The 3D camera, lights and ball for a given time (seconds). */
export const ballShotAt = (t: number): Shot => {
  const pull = interpolate(t, [0, CUE.strike], [0, 1], {
    ...clamp,
    easing: EASE.inOutCubic,
  });
  const sinceStrike = Math.max(0, t - CUE.strike);
  const struck = t >= CUE.strike;
  const shake = struck ? Math.exp(-sinceStrike / 0.16) : 0;
  // A struck ball leaves the tee at full speed: no ease-in.
  const launch = interpolate(sinceStrike, [0, 0.28], [0, 1], clamp);

  return {
    rim: interpolate(t, [CUE.rimIn, CUE.rimIn + 1.1], [0, 1], {
      ...clamp,
      easing: EASE.inOutSine,
    }),
    key: interpolate(t, [CUE.keyIn, CUE.keyIn + 1.5], [0, 0.9], {
      ...clamp,
      easing: EASE.inOutSine,
    }),
    keyAngle: interpolate(t, [CUE.keyIn, CUE.strike], [0.05, 1.45], clamp),
    cupGlow: interpolate(t, [0.6, 1.6], [0, 1], clamp) * (1 + 1.5 * shake),
    camera: {
      x:
        interpolate(pull, [0, 1], [0.55, 0]) +
        0.06 * shake * noise2D("shake-x", t * 18, 0),
      y:
        interpolate(pull, [0, 1], [1.55, 0.9]) +
        0.06 * shake * noise2D("shake-y", t * 18, 1),
      z:
        interpolate(pull, [0, 1], [2.4, 11]) +
        0.25 * interpolate(sinceStrike, [0, 0.6], [0, 1], clamp),
      lookY: interpolate(pull, [0, 1], [1.15, 0.6]),
      fov: 28,
    },
    spin: t * 0.12 + 46 * launch,
    launch: { x: 5 * launch, y: 16 * launch ** 1.3, z: -7 * launch },
    teeTilt: struck
      ? 0.1 * Math.exp(-sinceStrike / 0.3) * Math.sin(sinceStrike * 38)
      : 0,
  };
};

// Scene 1 hero shot, rendered on its own (see scripts/render-advert.sh) so
// the rest of the advert can be iterated on without re-rendering 3D.
export const BallShot: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#050806" }}>
      <GolfBall3D
        width={width}
        height={height}
        shot={ballShotAt(frame / FPS)}
      />
    </AbsoluteFill>
  );
};
