import React from "react";
import { AbsoluteFill } from "remotion";
import { SAFE_AREA } from "../config";

// Lays content out inside the area that social-app UI never covers.
export const SafeArea: React.FC<{
  children: React.ReactNode;
  justify?: React.CSSProperties["justifyContent"];
  align?: React.CSSProperties["alignItems"];
  gap?: number;
}> = ({ children, justify = "center", align = "flex-start", gap = 32 }) => (
  <AbsoluteFill
    style={{
      paddingTop: SAFE_AREA.top,
      paddingBottom: SAFE_AREA.bottom,
      paddingLeft: SAFE_AREA.left,
      paddingRight: SAFE_AREA.right,
      flexDirection: "column",
      justifyContent: justify,
      alignItems: align,
      gap,
    }}
  >
    {children}
  </AbsoluteFill>
);
