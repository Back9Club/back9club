import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EASE } from "../motion/easing";

// Kinetic type: each word rises out of its own mask, staggered.
// Frames are relative to the enclosing <Sequence> / scene.
export const RevealText: React.FC<{
  text: string;
  style?: React.CSSProperties;
  /** Frame the first word starts moving. */
  delay?: number;
  /** Frames between words. */
  stagger?: number;
  /** Frames each word takes to land. */
  duration?: number;
}> = ({ text, style, delay = 0, stagger = 3, duration = 22 }) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        columnGap: "0.25em",
        ...style,
      }}
    >
      {words.map((word, i) => {
        const progress = interpolate(
          frame,
          [delay + i * stagger, delay + i * stagger + duration],
          [0, 1],
          {
            easing: EASE.outExpo,
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        );
        return (
          // Padding + negative margin give descenders room inside the mask.
          <span
            key={`${word}-${i}`}
            style={{
              display: "inline-block",
              overflow: "hidden",
              paddingBottom: "0.12em",
              marginBottom: "-0.12em",
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - progress) * 110}%)`,
              }}
            >
              {word}
            </span>
          </span>
        );
      })}
    </div>
  );
};
