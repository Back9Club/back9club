import { Easing, type SpringConfig } from "remotion";

// Curated easing curves. These are the same curves as CSS cubic-bezier(),
// so values can be copied straight from After Effects / Figma / easings.net.
export const EASE = {
  /** Fast start, long soft landing. Best default for things entering. */
  outExpo: Easing.bezier(0.16, 1, 0.3, 1),
  /** Gentler version of outExpo. */
  outCubic: Easing.bezier(0.33, 1, 0.68, 1),
  /** Soft start, fast exit. For things leaving the frame. */
  inExpo: Easing.bezier(0.7, 0, 0.84, 0),
  /** Gentler exit acceleration than inExpo. */
  inCubic: Easing.bezier(0.32, 0, 0.67, 0),
  /** Slow-fast-slow. The classic "motion graphics" transition curve. */
  inOutExpo: Easing.bezier(0.87, 0, 0.13, 1),
  /** Slightly softer than inOutExpo; great for wipes and pushes. */
  inOutQuart: Easing.bezier(0.76, 0, 0.24, 1),
  /** Even, polished in-out. Safe for almost anything. */
  inOutCubic: Easing.bezier(0.65, 0, 0.35, 1),
  /** Very soft in-out. Best for crossfades and blur dissolves. */
  inOutSine: Easing.bezier(0.37, 0, 0.63, 1),
  /** Small overshoot then settle. Use sparingly (pops, badges). */
  outBack: Easing.bezier(0.34, 1.56, 0.64, 1),
  linear: Easing.linear,
} as const;

// Spring presets for spring() / springTiming().
export const SPRING = {
  /** Critically damped: no bounce, smooth settle. */
  smooth: { damping: 200 },
  /** Quick and tight with a hint of life. */
  snappy: { damping: 20, stiffness: 200 },
  /** Playful bounce. */
  bouncy: { damping: 9, stiffness: 120 },
  /** Slow and weighty. */
  heavy: { damping: 30, stiffness: 80, mass: 2 },
} as const satisfies Record<string, Partial<SpringConfig>>;
