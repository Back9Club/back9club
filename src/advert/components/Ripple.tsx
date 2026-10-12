import React from "react";
import { EASE } from "../../motion/easing";
import { prog } from "../../teaser/components/time";

/**
 * Tracked label text whose letters rise out of a slot one after another.
 * For small, widely spaced type only: each letter is its own box, so pair
 * kerning is lost (invisible at wide tracking).
 */
export const Ripple: React.FC<{
  t: number;
  at: number;
  text: string;
  /** Delay between letters (s). */
  stagger?: number;
  dur?: number;
  /** Per-letter colour override, by index. */
  colorAt?: (i: number) => string | undefined;
  style?: React.CSSProperties;
}> = ({ t, at, text, stagger = 0.018, dur = 0.3, colorAt, style }) => (
  <div style={{ display: "flex", ...style }}>
    {[...text].map((ch, i) => {
      const p = prog(t, at + i * stagger, dur, EASE.outExpo);
      return (
        <span
          key={i}
          style={{
            display: "inline-block",
            overflow: "hidden",
            padding: "0.1em 0",
            margin: "-0.1em 0",
          }}
        >
          <span
            style={{
              display: "inline-block",
              transform: `translateY(${(1 - p) * 115}%)`,
              color: colorAt?.(i),
              whiteSpace: "pre",
            }}
          >
            {ch}
          </span>
        </span>
      );
    })}
  </div>
);
