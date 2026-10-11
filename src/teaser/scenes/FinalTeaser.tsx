import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { EASE } from "../../motion/easing";
import { Logo } from "../components/Logo";
import { MaskLine } from "../components/MaskLine";
import { kick, lerp, prog, useTime } from "../components/time";
import { DEPTH_SHADOW, DISPLAY, INK, LABEL, SIZE } from "../theme";
import { CUE } from "../timeline";

const LOGO_WIDTH = 720;
const LOGO_HEIGHT = (LOGO_WIDTH * 1504) / 2936;
const LOGO_CENTER_Y = 800;

// Each word lands with the voiceover: "Watch / this / space."
const WORDS = [
  { text: "WATCH", at: CUE.watchThisSpace },
  { text: "THIS", at: CUE.watchThisSpace + 0.22 },
  { text: "SPACE.", at: CUE.watchThisSpace + 0.46 },
];

// Scene 6 (16.6-19.5s): a slow, luxurious logo reveal on deep black, the
// call to action word by word, a discreet opening line, then a band of green
// light crosses the brand name and lands on the final impact. Holds to the end.
export const FinalTeaser: React.FC = () => {
  const t = useTime();

  const white = prog(t, CUE.logoFinal, 1.3, EASE.outCubic);
  const green = prog(t, CUE.logoFinal + 0.1, 1.0, EASE.inOutCubic);
  const settle = prog(t, CUE.logoFinal, 2.2, EASE.outCubic);
  const sharpen = prog(t, CUE.logoFinal, 0.9, EASE.outCubic);
  const sweep = interpolate(
    t,
    [CUE.footer, CUE.finalHit + 0.1],
    [-0.25, 1.25],
    {
      easing: EASE.inOutCubic,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const hit = kick(t, CUE.finalHit, 0.35);
  const footer = prog(t, CUE.footer, 1.0);

  return (
    <AbsoluteFill style={{ transform: `scale(${1 + 0.012 * hit})` }}>
      <div
        style={{
          position: "absolute",
          left: (1080 - LOGO_WIDTH) / 2,
          top: LOGO_CENTER_Y - LOGO_HEIGHT / 2,
          transform: `scale(${lerp(1.05, 1, settle)})`,
          filter: sharpen < 1 ? `blur(${(1 - sharpen) * 8}px)` : undefined,
        }}
      >
        <Logo
          width={LOGO_WIDTH}
          white={white}
          green={green}
          sweep={sweep}
          glow={
            0.35 * prog(t, CUE.logoFinal + 0.4, 1.2, EASE.outCubic) + 0.45 * hit
          }
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1112,
          display: "flex",
          justifyContent: "center",
          gap: "0.24em",
          fontSize: SIZE.watch,
        }}
      >
        {WORDS.map((word) => (
          <MaskLine key={word.text} progress={prog(t, word.at, 0.6)}>
            <div
              style={{
                ...DISPLAY,
                fontSize: SIZE.watch,
                textShadow: DEPTH_SHADOW,
              }}
            >
              {word.text}
            </div>
          </MaskLine>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1430,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 26,
          opacity: 0.72 * footer,
        }}
      >
        <div
          style={{ width: 70 * footer, height: 1, backgroundColor: INK.steel }}
        />
        <div
          style={{
            ...LABEL,
            fontSize: 26,
            letterSpacing: `${lerp(0.6, 0.42, footer)}em`,
            marginRight: `-${lerp(0.6, 0.42, footer)}em`,
          }}
        >
          Opening early 2027
        </div>
        <div
          style={{ width: 70 * footer, height: 1, backgroundColor: INK.steel }}
        />
      </div>
    </AbsoluteFill>
  );
};
