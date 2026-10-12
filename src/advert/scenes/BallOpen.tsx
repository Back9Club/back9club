import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { EASE } from "../../motion/easing";
import { kick, lerp, prog, useTime } from "../../teaser/components/time";
import { Trajectory } from "../../teaser/components/Trajectory";
import { INK, LABEL } from "../../teaser/theme";
import { CUE } from "../timeline";

// Where the ball sits on screen at the moment of the strike (from the 3D shot).
const BALL = { x: 540, y: 860, r: 335 };
// Where the club meets the ball (bottom of the ball, at the tee cup).
const CONTACT_Y = BALL.y + BALL.r * 0.92;
// The club head's path into the ball, and the ball's flight out of frame.
const SWING = "M -160 1290 C 120 1260, 300 1215, 420 1170";
const FLIGHT = `M ${BALL.x} ${BALL.y} C 700 520, 880 120, 1260 -320`;

// Scene 1 (0-3.6s): the 3D hero shot (a golf ball emerging from darkness
// under green light, pulled back to reveal it on the tee) with the strike
// sold in 2D on top: the swing streak, an impact flash, and a motion-blurred
// trail as the ball leaves frame.
export const BallOpen: React.FC = () => {
  const t = useTime();

  const kicker =
    prog(t, CUE.kicker, 0.9) *
    (1 - prog(t, CUE.swing - 0.2, 0.3, EASE.inCubic));
  const swing = prog(t, CUE.swing, CUE.strike - CUE.swing + 0.02, EASE.inCubic);
  const swingFade = 1 - prog(t, CUE.strike, 0.25, EASE.outCubic);
  const flash = kick(t, CUE.strike, 0.09);
  const trail = prog(t, CUE.strike, 0.22, EASE.outCubic);
  const trailFade = 1 - prog(t, CUE.strike + 0.18, 0.4, EASE.inOutCubic);

  return (
    <AbsoluteFill>
      <OffthreadVideo src={staticFile("advert/ball-shot.mp4")} muted />

      <div
        style={{
          position: "absolute",
          top: 300,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: kicker,
        }}
      >
        <div
          style={{
            ...LABEL,
            fontSize: 26,
            letterSpacing: `${lerp(0.75, 0.5, kicker)}em`,
            marginRight: `-${lerp(0.75, 0.5, kicker)}em`,
            color: INK.white,
          }}
        >
          Indoor golf <span style={{ color: "#27B936" }}>·</span> Hastings
        </div>
      </div>

      {swing > 0 && swingFade > 0 ? (
        <Trajectory
          d={SWING}
          progress={swing}
          trail={0.7}
          width={10}
          trace={0}
          opacity={swingFade}
          ballRadius={0.01}
          color="#9BF5BF"
        />
      ) : null}

      {trail > 0 && trailFade > 0 ? (
        <Trajectory
          d={FLIGHT}
          progress={trail}
          trail={0.55}
          width={lerp(20, 8, trail)}
          trace={0.22}
          opacity={trailFade}
          ballRadius={0.01}
          color={INK.white}
        />
      ) : null}

      {/* Impact: an anamorphic flare along the contact line plus a brief bloom. */}
      {flash > 0.01 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: CONTACT_Y - 3,
              height: 6,
              opacity: flash,
              background:
                "linear-gradient(90deg, rgba(155,245,191,0) 0%, rgba(210,255,228,0.9) 40%, #FFFFFF 50%, rgba(210,255,228,0.9) 60%, rgba(155,245,191,0) 100%)",
              boxShadow: "0 0 30px 6px rgba(43,212,110,0.55)",
            }}
          />
          <AbsoluteFill
            style={{
              opacity: 0.85 * flash,
              background: `radial-gradient(18% 9% at 50% ${CONTACT_Y / 19.2}%, rgba(235,255,242,0.95) 0%, rgba(43,212,110,0.35) 45%, rgba(0,0,0,0) 100%)`,
              mixBlendMode: "screen",
            }}
          />
        </>
      ) : null}
    </AbsoluteFill>
  );
};
