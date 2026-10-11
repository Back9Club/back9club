import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { EASE } from "../../motion/easing";
import { Logo } from "../components/Logo";
import { PrecisionArcs } from "../components/PrecisionArcs";
import { kick, lerp, prog, useTime } from "../components/time";
import { INK, LABEL } from "../theme";
import { CUE } from "../timeline";

const CENTER_Y = 860;
const LOGO_WIDTH = 720;
const LOGO_HEIGHT = (LOGO_WIDTH * 1504) / 2936;

// Scene 2 (3.5-6.5s): precision arcs draw on and spin down to rest on the
// beat, resolving into the logo: the green 9 draws first, the lettering opens
// from the centre, then the tagline tracks in. Exits by flying through the
// rings (expanding-circle transition into scene 3).
export const BrandReveal: React.FC = () => {
  const t = useTime();

  // Fly out through the rings just ahead of the iris opening into scene 3.
  const exit = prog(t, CUE.ringsExpand - 0.12, 0.42, EASE.inCubic);
  const push = interpolate(t, [CUE.arcsStart, CUE.ringsExpand], [1, 1.035], {
    easing: EASE.inOutSine,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const camera =
    push * (1 + 0.012 * kick(t, CUE.logoLand, 0.2)) * (1 + 0.5 * exit);

  const green = prog(t, CUE.logoLand - 0.18, 0.6, EASE.inOutCubic);
  const white = prog(t, CUE.logoLand - 0.02, 0.85);
  const settle = prog(t, CUE.logoLand - 0.02, 1.4, EASE.outCubic);
  const sharpen = prog(t, CUE.logoLand - 0.02, 0.45, EASE.outCubic);

  const tagline = prog(t, CUE.tagline, 0.9);
  const rule = prog(t, CUE.tagline - 0.1, 0.7, EASE.inOutCubic);

  return (
    <AbsoluteFill
      style={{
        opacity: 1 - exit,
        filter: exit > 0.01 ? `blur(${exit * 14}px)` : undefined,
      }}
    >
      <AbsoluteFill style={{ transform: `scale(${camera})` }}>
        <PrecisionArcs
          t={t}
          start={CUE.arcsStart}
          land={CUE.logoLand}
          exit={exit}
          cy={CENTER_Y}
        />

        <div
          style={{
            position: "absolute",
            left: (1080 - LOGO_WIDTH) / 2,
            top: CENTER_Y - LOGO_HEIGHT / 2 - 18,
            transform: `scale(${lerp(1.06, 1, settle)})`,
            filter: sharpen < 1 ? `blur(${(1 - sharpen) * 10}px)` : undefined,
          }}
        >
          <Logo
            width={LOGO_WIDTH}
            white={white}
            green={green}
            glow={0.55 * prog(t, CUE.logoLand, 1.2, EASE.outCubic)}
          />
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: CENTER_Y + LOGO_HEIGHT / 2 + 62,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 26,
          }}
        >
          <div
            style={{
              width: 110 * rule,
              height: 2,
              background: `linear-gradient(90deg, ${INK.steel}00, ${INK.steelLight}, ${INK.steel}00)`,
            }}
          />
          <div
            style={{
              ...LABEL,
              fontSize: 27,
              letterSpacing: `${lerp(0.62, 0.38, tagline)}em`,
              // Trailing tracking would push the line off-centre.
              marginRight: `-${lerp(0.62, 0.38, tagline)}em`,
              opacity: 0.88 * tagline,
            }}
          >
            Indoor golf.{" "}
            <span style={{ color: INK.steelLight }}>Reimagined.</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
