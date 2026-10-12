import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { EASE } from "../../motion/easing";
import { ContourField } from "../../teaser/components/ContourField";
import { MaskLine } from "../../teaser/components/MaskLine";
import { MotionBlur } from "../../teaser/components/MotionBlur";
import { kick, lerp, prog, useTime } from "../../teaser/components/time";
import { DISPLAY, INK } from "../../teaser/theme";
import { TYPE_SHADOW } from "../style";
import { CUE, FPS } from "../timeline";

const DIGITS = ["2", "0", "2", "7"];
const RISE = 0.34;
const STAGGER = 0.075;
const YEAR_SIZE = 410;
const METAL =
  "linear-gradient(180deg, #FFFFFF 0%, #F4F5F0 42%, #C9CFCB 78%, #9EA7A2 100%)";

const digitStart = (i: number) =>
  CUE.yearLand - RISE - (DIGITS.length - 1 - i) * STAGGER;
const digitOffset = (t: number, i: number) =>
  1 - prog(t, digitStart(i), RISE, EASE.outCubic);

// Scene 3 (7.0-10.4s): "OPENING EARLY" rises over living putting-green
// contours; the digits of 2027 rise one after another with directional motion
// blur and land on the impact, where a sheen crosses them and a green rule
// draws out beneath. Exits by zooming through the year.
export const OpeningYear: React.FC = () => {
  const t = useTime();
  const enter = prog(t, CUE.statementOut + 0.15, 0.5, EASE.outCubic);
  const exit = prog(t, CUE.openingOut, 0.32, EASE.inCubic);
  const impact = kick(t, CUE.yearLand, 0.22);
  const drift = interpolate(t, [CUE.opening, CUE.openingOut], [1.04, 1], {
    easing: EASE.outCubic,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sheen = interpolate(t, [CUE.yearLand, CUE.yearLand + 0.8], [-30, 130], {
    easing: EASE.inOutCubic,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rule = prog(t, CUE.yearLand, 0.7);

  return (
    <AbsoluteFill
      style={{
        opacity: enter * (1 - exit),
        transform: `scale(${drift * (1 + 0.025 * impact) * (1 + 0.6 * exit)})`,
        filter: exit > 0.01 ? `blur(${exit * 20}px)` : undefined,
      }}
    >
      <ContourField
        t={t}
        opacity={0.75}
        pulse={impact}
        driftY={(t - CUE.opening) * 22}
      />

      <div
        style={{
          position: "absolute",
          top: 640,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: "0.24em",
          fontSize: 96,
          filter: TYPE_SHADOW,
        }}
      >
        <MaskLine progress={prog(t, CUE.opening, 0.6)}>
          <div style={{ ...DISPLAY, fontSize: 96 }}>OPENING</div>
        </MaskLine>
        <MaskLine progress={prog(t, CUE.early, 0.6)}>
          <div
            style={{
              ...DISPLAY,
              fontSize: 96,
              color: "#27B936",
            }}
          >
            EARLY
          </div>
        </MaskLine>
      </div>

      <div
        style={{
          position: "absolute",
          top: 760,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ position: "relative", display: "flex" }}>
          <div
            style={{
              display: "flex",
              filter: "drop-shadow(0 30px 50px rgba(0,0,0,0.55))",
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
                    <div
                      style={{
                        ...DISPLAY,
                        fontSize: YEAR_SIZE,
                        lineHeight: 0.92,
                        backgroundImage: METAL,
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                      }}
                    >
                      {digit}
                    </div>
                  </MotionBlur>
                </div>
              );
            })}
          </div>
          {sheen > -30 && sheen < 130 ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                backgroundImage: `linear-gradient(105deg, rgba(255,255,255,0) ${sheen - 14}%, rgba(120,232,168,0.8) ${sheen}%, rgba(255,255,255,0) ${sheen + 14}%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                pointerEvents: "none",
              }}
            >
              {DIGITS.map((digit, i) => (
                <div
                  key={i}
                  style={{
                    ...DISPLAY,
                    fontSize: YEAR_SIZE,
                    lineHeight: 0.92,
                    color: "transparent",
                  }}
                >
                  {digit}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 760 + YEAR_SIZE * 0.92 + 40,
          left: 540 - 300 * rule,
          width: 600 * rule,
          height: 4,
          borderRadius: 2,
          background: `linear-gradient(90deg, rgba(39,185,54,0), ${INK.green} 20%, #27B936 50%, ${INK.green} 80%, rgba(39,185,54,0))`,
          boxShadow: `0 0 24px rgba(39,185,54,${0.6 * rule})`,
          opacity: lerp(0, 1, rule),
        }}
      />
    </AbsoluteFill>
  );
};
