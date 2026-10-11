import type { TransitionTiming } from "@remotion/transitions";
import { VIDEO } from "../config";

// Length of a <TransitionSeries>. Transitions overlap the scenes on either
// side, so each one shortens the total by its own duration. (Overlays don't.)
export const getSeriesDuration = (
  sceneDurations: readonly number[],
  transitionTimings: readonly TransitionTiming[],
  fps: number = VIDEO.fps,
) =>
  sceneDurations.reduce((sum, d) => sum + d, 0) -
  transitionTimings.reduce((sum, t) => sum + t.getDurationInFrames({ fps }), 0);
