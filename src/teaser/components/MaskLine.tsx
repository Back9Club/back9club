import React from "react";

// One line of type revealed through a hard mask: the glyphs rise out of an
// invisible slot with a slight backwards tilt that straightens as they land,
// which reads as depth.
export const MaskLine: React.FC<{
  /** 0 = hidden below the slot, 1 = in place. */
  progress: number;
  /** Optional exit: 0 = in place, 1 = gone through the top of the slot. */
  exit?: number;
  from?: "below" | "above";
  children: React.ReactNode;
  style?: React.CSSProperties;
  innerStyle?: React.CSSProperties;
}> = ({ progress, exit = 0, from = "below", children, style, innerStyle }) => {
  const dir = from === "below" ? 1 : -1;
  const y = (1 - progress) * 108 * dir - exit * 108 * dir;
  const tilt = (1 - progress) * 38 * dir;
  return (
    <div
      style={{
        overflow: "hidden",
        // Room for the cap height plus overshoot, without clipping glyphs.
        padding: "0.06em 0.04em",
        margin: "-0.06em -0.04em",
        ...style,
      }}
    >
      <div
        style={{
          transform: `perspective(900px) translateY(${y}%) rotateX(${tilt}deg)`,
          transformOrigin: from === "below" ? "50% 100%" : "50% 0%",
          ...innerStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
};
