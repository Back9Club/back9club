import type React from "react";
import { FONTS } from "../theme";

// Bold Swiss palette.
export const C = {
  ink: "#0B0B0F",
  vermilion: "#FF4D2E",
  blue: "#2F4BFF",
  cream: "#F5F1E8",
  yellow: "#FFC93C",
} as const;

// Archivo Expanded Black.
export const WIDE: React.CSSProperties = {
  fontFamily: FONTS.condensed,
  fontStretch: "125%",
  fontWeight: 900,
  textTransform: "uppercase",
  lineHeight: 1,
  whiteSpace: "nowrap",
  letterSpacing: "-0.01em",
};

export const MONO_LABEL: React.CSSProperties = {
  fontFamily: FONTS.body,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.3em",
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
};
