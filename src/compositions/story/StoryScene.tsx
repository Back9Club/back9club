import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background } from "../../components/Background";
import { RevealText } from "../../components/RevealText";
import { SafeArea } from "../../components/SafeArea";
import { EASE } from "../../motion/easing";
import { COLORS, FONTS, TYPE } from "../../theme";

export type StoryTheme = "dark" | "light";

const THEMES = {
  dark: {
    top: COLORS.fairway,
    bottom: COLORS.ink,
    glow: COLORS.green,
    text: COLORS.cream,
    accent: COLORS.gold,
  },
  light: {
    top: COLORS.cream,
    bottom: COLORS.sand,
    glow: COLORS.white,
    text: COLORS.ink,
    accent: COLORS.fairway,
  },
} as const;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// A single text scene: kicker + accent rule, kinetic headline, body copy.
export const StoryScene: React.FC<{
  kicker: string;
  headline: string;
  body: string;
  theme: StoryTheme;
}> = ({ kicker, headline, body, theme }) => {
  const frame = useCurrentFrame();
  const t = THEMES[theme];

  return (
    <AbsoluteFill style={{ color: t.text, fontFamily: FONTS.body }}>
      <Background top={t.top} bottom={t.bottom} glow={t.glow} />
      <SafeArea justify="center" gap={40}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: TYPE.caption,
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: t.accent,
              opacity: interpolate(frame, [0, 12], [0, 1], clamp),
            }}
          >
            {kicker}
          </div>
          <div
            style={{
              width: 120,
              height: 6,
              borderRadius: 3,
              backgroundColor: t.accent,
              transformOrigin: "left center",
              transform: `scaleX(${interpolate(frame, [2, 26], [0, 1], { ...clamp, easing: EASE.outExpo })})`,
            }}
          />
        </div>
        <RevealText
          text={headline}
          delay={6}
          style={{
            fontFamily: FONTS.display,
            fontSize: TYPE.headline,
            fontWeight: 800,
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
          }}
        />
        {body ? (
          <div
            style={{
              fontSize: TYPE.body,
              fontWeight: 500,
              lineHeight: 1.3,
              opacity: interpolate(frame, [18, 34], [0, 0.8], clamp),
              transform: `translateY(${interpolate(frame, [18, 40], [24, 0], { ...clamp, easing: EASE.outExpo })}px)`,
            }}
          >
            {body}
          </div>
        ) : null}
      </SafeArea>
    </AbsoluteFill>
  );
};
