import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { EASE } from "../../motion/easing";
import { MaskLine } from "../components/MaskLine";
import { kick, lerp, prog, useTime } from "../components/time";
import { Trajectory } from "../components/Trajectory";
import { DEPTH_SHADOW, DISPLAY, INK, SIZE } from "../theme";
import { CUE } from "../timeline";

// High arc: stays clear of the type, before and after it reframes.
const FLIGHT = "M -60 1300 C 180 380, 620 180, 1170 360";
const STATEMENT = ["GOLF IS", "ABOUT TO", "CHANGE."];

// Scene 1 (0-3.5s): near black, a slow golf-ball trajectory, the camera
// creeping forward. "HASTINGS." opens through a mask; on the bass hit it
// reframes upwards as "GOLF IS ABOUT TO CHANGE." lands. Exits through a
// slanted directional wipe with a green light edge.
export const Hook: React.FC = () => {
  const t = useTime();

  const push = interpolate(t, [0, 3.6], [1, 1.07], { easing: EASE.inOutSine });
  const camera = push * (1 + 0.02 * kick(t, CUE.golfChange, 0.2));

  const flight = prog(
    t,
    CUE.trajectoryStart,
    CUE.trajectoryEnd - CUE.trajectoryStart,
    EASE.inOutSine,
  );
  const traceFade = 1 - prog(t, CUE.golfChange - 0.15, 0.4, EASE.inOutCubic);

  const hastingsIn = prog(t, CUE.hastings, 0.7);
  const reframe = prog(t, CUE.golfChange - 0.04, 0.7);
  const hastingsY = lerp(900, 560, reframe);
  const hastingsScale = lerp(1, 0.54, reframe);

  const wipe = prog(t, CUE.wipeOut, 0.34, EASE.inOutQuart);
  const edge = lerp(-360, 1260, wipe);
  const slant = 360;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          clipPath:
            wipe > 0
              ? `polygon(${edge + slant}px 0, 1080px 0, 1080px 1920px, ${edge}px 1920px)`
              : undefined,
        }}
      >
        <AbsoluteFill style={{ transform: `scale(${camera})` }}>
          <Trajectory
            d={FLIGHT}
            progress={flight}
            trail={0.42}
            width={3.5}
            trace={0.32 * traceFade}
            opacity={traceFade}
          />

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: hastingsY,
              display: "flex",
              justifyContent: "center",
              transform: `translateY(-50%) scale(${hastingsScale})`,
            }}
          >
            <MaskLine progress={hastingsIn}>
              <div
                style={{
                  ...DISPLAY,
                  fontSize: SIZE.hastings,
                  textShadow: DEPTH_SHADOW,
                }}
              >
                HASTINGS<span style={{ color: INK.green }}>.</span>
              </div>
            </MaskLine>
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 948,
              transform: "translateY(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            {STATEMENT.map((line, i) => (
              <MaskLine
                key={line}
                progress={prog(t, CUE.golfChange + i * 0.07, 0.75)}
              >
                <div
                  style={{
                    ...DISPLAY,
                    fontSize: SIZE.statement,
                    lineHeight: 0.9,
                    textShadow: DEPTH_SHADOW,
                  }}
                >
                  {line}
                </div>
              </MaskLine>
            ))}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {wipe > 0 && wipe < 1 ? (
        <svg
          width={1080}
          height={1920}
          style={{ position: "absolute", inset: 0 }}
        >
          <line
            x1={edge + slant}
            y1={0}
            x2={edge}
            y2={1920}
            stroke={INK.green}
            strokeWidth={10}
            strokeOpacity={0.35 * Math.sin(Math.PI * wipe)}
            style={{ filter: "blur(8px)" }}
          />
          <line
            x1={edge + slant}
            y1={0}
            x2={edge}
            y2={1920}
            stroke={INK.white}
            strokeWidth={2}
            strokeOpacity={0.8 * Math.sin(Math.PI * wipe)}
          />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
