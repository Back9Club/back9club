import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { EASE } from "../../motion/easing";
import { ContourField } from "../components/ContourField";
import { MaskLine } from "../components/MaskLine";
import { MotionBlur } from "../components/MotionBlur";
import { kick, lerp, prog, useTime } from "../components/time";
import { DEPTH_SHADOW, DISPLAY, INK, SIZE } from "../theme";
import { CUE, FPS } from "../timeline";

const IRIS_X = 540;
const IRIS_Y = 860;
const DIGITS = ["2", "0", "2", "7"];
const DIGIT_RISE = 0.34;
const DIGIT_STAGGER = 0.075;

// Digit i starts so the last digit lands exactly on the impact cue.
const digitStart = (i: number) =>
  CUE.digitsLand - DIGIT_RISE - (DIGITS.length - 1 - i) * DIGIT_STAGGER;

const digitOffset = (t: number, i: number) =>
  1 - prog(t, digitStart(i), DIGIT_RISE, EASE.outCubic);

const METAL =
  "linear-gradient(180deg, #FFFFFF 0%, #F4F5F0 42%, #C9CFCB 78%, #9EA7A2 100%)";

// Scene 3 (6.5-9.3s): an iris opens out of the brand rings onto a living
// putting-green contour map. "OPENING" then "EARLY" rise in; the digits of
// 2027 rise one after another with directional motion blur and land on the
// deep impact, where a sheen of light crosses them.
export const Opening: React.FC = () => {
  const t = useTime();

  const iris = prog(t, CUE.ringsExpand + 0.04, 0.5, EASE.inOutExpo);
  const radius = lerp(0, 1250, iris);
  const exit = prog(t, 9.1, 0.32, EASE.inExpo);

  const drift = interpolate(t, [CUE.ringsExpand, 9.3], [1.06, 1], {
    easing: EASE.outCubic,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const impact = kick(t, CUE.digitsLand, 0.22);
  const camera = drift * (1 + 0.025 * impact);
  const sheen = interpolate(
    t,
    [CUE.digitsLand, CUE.digitsLand + 0.75],
    [-0.3, 1.3],
    {
      easing: EASE.inOutCubic,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          clipPath:
            iris < 1
              ? `circle(${radius}px at ${IRIS_X}px ${IRIS_Y}px)`
              : undefined,
          backgroundColor: "#0B1511",
        }}
      >
        <AbsoluteFill
          style={{
            transform: `translateY(${-300 * exit}px) scale(${camera})`,
            opacity: 1 - exit,
            filter: exit > 0.01 ? `blur(${18 * exit}px)` : undefined,
          }}
        >
          <ContourField
            t={t}
            opacity={0.95}
            pulse={impact}
            driftY={(t - CUE.ringsExpand) * 26}
          />

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 640,
              display: "flex",
              justifyContent: "center",
              gap: "0.26em",
              fontSize: SIZE.openingEarly,
            }}
          >
            <MaskLine progress={prog(t, CUE.opening, 0.7)}>
              <div
                style={{
                  ...DISPLAY,
                  fontSize: SIZE.openingEarly,
                  textShadow: DEPTH_SHADOW,
                }}
              >
                OPENING
              </div>
            </MaskLine>
            <MaskLine progress={prog(t, CUE.early, 0.7)}>
              <div
                style={{
                  ...DISPLAY,
                  fontSize: SIZE.openingEarly,
                  color: INK.green,
                  textShadow: DEPTH_SHADOW,
                }}
              >
                EARLY
              </div>
            </MaskLine>
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 770,
              display: "flex",
              justifyContent: "center",
            }}
          >
            {DIGITS.map((digit, i) => {
              const off = digitOffset(t, i);
              const speed = Math.abs(off - digitOffset(t - 1 / FPS, i));
              return (
                <div
                  key={i}
                  style={{
                    overflow: "hidden",
                    padding: "0.04em 0",
                    margin: "-0.04em 0",
                  }}
                >
                  <MotionBlur
                    amount={speed * 260}
                    style={{ transform: `translateY(${off * 104}%)` }}
                  >
                    <div style={{ position: "relative" }}>
                      <div
                        style={{
                          ...DISPLAY,
                          fontSize: SIZE.year,
                          lineHeight: 0.92,
                          backgroundImage: METAL,
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          color: "transparent",
                          filter: "drop-shadow(0 30px 50px rgba(0,0,0,0.55))",
                        }}
                      >
                        {digit}
                      </div>
                    </div>
                  </MotionBlur>
                </div>
              );
            })}
          </div>

          {sheen > -0.3 && sheen < 1.3 ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 770,
                display: "flex",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              {/* Same per-digit layout as above so the sheen lines up exactly. */}
              <div
                style={{
                  display: "flex",
                  backgroundImage: `linear-gradient(105deg, rgba(255,255,255,0) ${sheen * 100 - 14}%, rgba(120,232,168,0.8) ${sheen * 100}%, rgba(255,255,255,0) ${sheen * 100 + 14}%)`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                }}
              >
                {DIGITS.map((digit, i) => (
                  <div
                    key={i}
                    style={{
                      ...DISPLAY,
                      fontSize: SIZE.year,
                      lineHeight: 0.92,
                      color: "transparent",
                    }}
                  >
                    {digit}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </AbsoluteFill>
      </AbsoluteFill>

      {iris > 0 && iris < 1 ? (
        <svg
          width={1080}
          height={1920}
          style={{ position: "absolute", inset: 0 }}
        >
          {[0, 46, 104].map((offset, i) => (
            <circle
              key={offset}
              cx={IRIS_X}
              cy={IRIS_Y}
              r={radius + offset}
              fill="none"
              stroke={i === 0 ? INK.white : INK.green}
              strokeWidth={i === 0 ? 2 : 1.5}
              strokeOpacity={
                (i === 0 ? 0.85 : 0.5) * Math.min(1, iris * 6) * (1 - iris)
              }
            />
          ))}
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
