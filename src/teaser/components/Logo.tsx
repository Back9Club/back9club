import React, { useId } from "react";
import {
  LOGO_GREEN,
  LOGO_GREEN_PATH,
  LOGO_PATH_TRANSFORM,
  LOGO_STAMP,
  LOGO_VIEWBOX,
  LOGO_WHITE_PATH,
} from "../../brand/logo-paths";
import { FONTS } from "../../theme";
import { INK } from "../theme";

const { width: VW, height: VH } = LOGO_VIEWBOX;

// The Back 9 Club logo (traced from the supplied artwork) with independently
// animatable layers: the green 9 draws down (or flickers on like neon), the
// lettering opens from the centre or wipes in from the left, and a band of
// green light can sweep across the letterforms.
export const Logo: React.FC<{
  width: number;
  /** 0..1 reveal of the white lettering (opens from the centre). */
  white: number;
  /** 0..1 reveal of the green 9 (draws top to bottom). */
  green: number;
  /** Position of the light sweep across the logo, 0..1 (null = off). */
  sweep?: number | null;
  /** 0..1 soft green glow behind the mark. */
  glow?: number;
  /** How the lettering is revealed: opening from the centre, or wiping in from the left. */
  whiteFrom?: "center" | "left";
  /** Opacity of the green 9 (for a neon flicker-on). */
  greenOpacity?: number;
  /** 0..1 neon glow around the green 9. */
  greenGlow?: number;
  style?: React.CSSProperties;
}> = ({
  width,
  white,
  green,
  sweep = null,
  glow = 0,
  whiteFrom = "center",
  greenOpacity = 1,
  greenGlow = 0,
  style,
}) => {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  // Half-width of the opening (soft edges included), 0 when hidden.
  const half = (VW / 2 + 160) * Math.min(1, white * 1.08);
  // Left-to-right wipe: leading edge position (soft edge included).
  const edge = -320 + (VW + 640) * Math.min(1, white);
  const height = (width * VH) / VW;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${VW} ${VH}`}
      style={{
        overflow: "visible",
        filter:
          glow > 0.01
            ? `drop-shadow(0 0 ${40 * glow}px rgba(35,139,87,${0.55 * glow}))`
            : undefined,
        ...style,
      }}
    >
      <defs>
        <linearGradient id={`soft-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="black" />
          <stop offset="0.06" stopColor="white" />
          <stop offset="0.94" stopColor="white" />
          <stop offset="1" stopColor="black" />
        </linearGradient>
        <linearGradient id={`edge-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="white" />
          <stop offset="0.85" stopColor="white" />
          <stop offset="1" stopColor="black" />
        </linearGradient>
        <mask id={`white-${id}`} maskUnits="userSpaceOnUse">
          {whiteFrom === "left" ? (
            <rect
              x={-320}
              y={-100}
              width={Math.max(0, edge + 320)}
              height={VH + 200}
              fill={`url(#edge-${id})`}
            />
          ) : (
            <rect
              x={VW / 2 - half}
              y={-100}
              width={2 * half}
              height={VH + 200}
              fill={`url(#soft-${id})`}
            />
          )}
        </mask>
        <filter id={`neon-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={18} result="wide" />
          <feGaussianBlur in="SourceGraphic" stdDeviation={5} result="tight" />
          <feMerge>
            <feMergeNode in="wide" />
            <feMergeNode in="tight" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`green-${id}`}>
          <rect x={0} y={-20} width={VW} height={(VH + 40) * green} />
        </clipPath>
        <clipPath id={`shape-${id}`}>
          <path d={LOGO_WHITE_PATH} transform={LOGO_PATH_TRANSFORM} />
          <path d={LOGO_GREEN_PATH} transform={LOGO_PATH_TRANSFORM} />
        </clipPath>
        <linearGradient id={`sweep-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#5FE39A" stopOpacity="0" />
          <stop offset="0.5" stopColor="#8BF2B6" stopOpacity="0.9" />
          <stop offset="1" stopColor="#5FE39A" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g mask={`url(#white-${id})`}>
        <path
          d={LOGO_WHITE_PATH}
          transform={LOGO_PATH_TRANSFORM}
          fill={INK.white}
        />
        <text
          x={LOGO_STAMP.x}
          y={LOGO_STAMP.y}
          textAnchor="middle"
          fontFamily={FONTS.body}
          fontWeight={700}
          fontSize={LOGO_STAMP.fontSize}
          textLength={LOGO_STAMP.width}
          lengthAdjust="spacingAndGlyphs"
          fill={INK.white}
        >
          EST 2026
        </text>
      </g>
      <g clipPath={`url(#green-${id})`} opacity={greenOpacity}>
        {greenGlow > 0.01 ? (
          <g filter={`url(#neon-${id})`} opacity={greenGlow}>
            <path
              d={LOGO_GREEN_PATH}
              transform={LOGO_PATH_TRANSFORM}
              fill={LOGO_GREEN}
            />
          </g>
        ) : null}
        <path
          d={LOGO_GREEN_PATH}
          transform={LOGO_PATH_TRANSFORM}
          fill={LOGO_GREEN}
        />
      </g>

      {sweep !== null && sweep > -0.3 && sweep < 1.3 ? (
        <g clipPath={`url(#shape-${id})`}>
          <rect
            x={-VW * 0.35 + sweep * VW * 1.35}
            y={-200}
            width={VW * 0.32}
            height={VH + 400}
            fill={`url(#sweep-${id})`}
            transform={`skewX(-18)`}
          />
        </g>
      ) : null}
    </svg>
  );
};
