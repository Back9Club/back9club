import React, { createContext, useContext } from "react";
import { interpolate, Sequence, useCurrentFrame } from "remotion";
import { EASE } from "../../motion/easing";
import { FPS, toFrame } from "../timeline";

const OffsetContext = createContext(0);

// A scene on the master timeline. Children read absolute time with useTime(),
// so every cue in timeline.json can be used as-is inside any scene.
export const Scene: React.FC<{
  name: string;
  from: number;
  to: number;
  children: React.ReactNode;
}> = ({ name, from, to, children }) => {
  const fromFrame = toFrame(from);
  return (
    <Sequence
      name={name}
      from={fromFrame}
      durationInFrames={toFrame(to) - fromFrame}
      premountFor={FPS}
    >
      <OffsetContext.Provider value={fromFrame}>
        {children}
      </OffsetContext.Provider>
    </Sequence>
  );
};

/** Absolute time on the master timeline, in seconds. */
export const useTime = () => {
  const frame = useCurrentFrame();
  return (frame + useContext(OffsetContext)) / FPS;
};

/** 0 -> 1 progress of an animation that starts at `start` and lasts `dur` seconds. */
export const prog = (
  t: number,
  start: number,
  dur: number,
  easing: (x: number) => number = EASE.outExpo,
) =>
  interpolate(t, [start, start + dur], [0, 1], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Exponential decay "kick" after an event: 1 at `at`, falling towards 0. */
export const kick = (t: number, at: number, decay = 0.12) =>
  t < at ? 0 : Math.exp(-(t - at) / decay);

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
