import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background } from "../../components/Background";
import { RevealText } from "../../components/RevealText";
import { SafeArea } from "../../components/SafeArea";
import { EASE } from "../../motion/easing";
import { COLORS, FONTS, TYPE } from "../../theme";

const PALETTES = [
  {
    top: COLORS.fairway,
    bottom: COLORS.ink,
    glow: COLORS.green,
    text: COLORS.cream,
  },
  {
    top: COLORS.cream,
    bottom: COLORS.sand,
    glow: COLORS.white,
    text: COLORS.ink,
  },
  {
    top: COLORS.green,
    bottom: COLORS.fairway,
    glow: COLORS.sand,
    text: COLORS.cream,
  },
  {
    top: COLORS.ink,
    bottom: COLORS.fairway,
    glow: COLORS.gold,
    text: COLORS.cream,
  },
] as const;

// One full-frame card in the transition showcase. High-contrast shapes and a
// giant numeral make it easy to judge how each transition moves.
export const DemoCard: React.FC<{
  index: number;
  kicker: string;
  title: string;
  note: string;
}> = ({ index, kicker, title, note }) => {
  const frame = useCurrentFrame();
  const palette = PALETTES[index % PALETTES.length];
  const numeral = String(index).padStart(2, "0");
  const ring = interpolate(frame, [0, 40], [0.85, 1], {
    easing: EASE.outExpo,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ color: palette.text, fontFamily: FONTS.body }}>
      <Background
        top={palette.top}
        bottom={palette.bottom}
        glow={palette.glow}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            width: 860,
            height: 860,
            borderRadius: "50%",
            border: `6px solid ${palette.text}`,
            opacity: 0.18,
            transform: `scale(${ring})`,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: 760,
          letterSpacing: "-0.06em",
          color: "transparent",
          WebkitTextStroke: `4px ${palette.text}`,
          opacity: 0.22,
        }}
      >
        {numeral}
      </AbsoluteFill>
      <SafeArea justify="space-between">
        <div
          style={{
            fontSize: TYPE.caption,
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: index % 2 === 1 ? COLORS.fairway : COLORS.gold,
          }}
        >
          {kicker}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <RevealText
            text={title}
            delay={4}
            style={{
              fontFamily: FONTS.display,
              fontSize: TYPE.headline,
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
            }}
          />
          <div style={{ fontSize: TYPE.body, fontWeight: 500, opacity: 0.75 }}>
            {note}
          </div>
        </div>
      </SafeArea>
    </AbsoluteFill>
  );
};
