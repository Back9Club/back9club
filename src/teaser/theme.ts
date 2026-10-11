import type React from "react";
import { FONTS } from "../theme";

export const INK = {
  black: "#090D0B",
  forest: "#102A20",
  green: "#238B57",
  white: "#F4F5F0",
  /** Muted metallic accents. */
  steel: "#A9B1AC",
  steelLight: "#D9DDD8",
} as const;

// Bold condensed display cut (Archivo, 70% width, ExtraBold).
export const DISPLAY: React.CSSProperties = {
  fontFamily: FONTS.condensed,
  fontStretch: "70%",
  fontWeight: 800,
  textTransform: "uppercase",
  color: INK.white,
  lineHeight: 1,
  whiteSpace: "nowrap",
};

// Small, widely tracked supporting text.
export const LABEL: React.CSSProperties = {
  fontFamily: FONTS.body,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.38em",
  color: INK.white,
  whiteSpace: "nowrap",
};

// Display text sizes. Glyph advances were measured (fontTools, Archivo at
// 70% width / weight 800) so each line fits the 800px-wide safe area.
export const SIZE = {
  hastings: 184,
  statement: 190,
  openingEarly: 118,
  year: 430,
  play: 130,
  watch: 92,
} as const;

// Depth shadow for hero type: a tight contact shadow plus a soft long throw.
export const DEPTH_SHADOW =
  "0 2px 0 rgba(0,0,0,0.45), 0 14px 28px rgba(0,0,0,0.55), 0 40px 90px rgba(0,0,0,0.6)";
