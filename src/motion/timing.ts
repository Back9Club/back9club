import { linearTiming, springTiming } from "@remotion/transitions";
import { sec } from "../config";
import { EASE, SPRING } from "./easing";

// Transition timing presets for <TransitionSeries.Transition timing={...} />.
// Each takes an optional duration in frames (project runs at 30fps).
export const TIMING = {
  /** ~0.4s. Decisive cuts: whip pans, pushes, wipes. */
  snappy: (durationInFrames = sec(0.4)) =>
    linearTiming({ durationInFrames, easing: EASE.inOutQuart }),
  /** ~0.6s. The default for most transitions. */
  smooth: (durationInFrames = sec(0.6)) =>
    linearTiming({ durationInFrames, easing: EASE.inOutCubic }),
  /** ~0.7s. Slow-fast-slow, the signature motion-graphics feel. */
  expo: (durationInFrames = sec(0.7)) =>
    linearTiming({ durationInFrames, easing: EASE.inOutExpo }),
  /** ~1s. Soft crossfades and dissolves. */
  gentle: (durationInFrames = sec(1)) =>
    linearTiming({ durationInFrames, easing: EASE.inOutSine }),
  /** ~0.7s. Physics-based, no overshoot. */
  spring: (durationInFrames = sec(0.7)) =>
    springTiming({ config: SPRING.smooth, durationInFrames }),
} as const;
