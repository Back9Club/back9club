// Brand tokens. Swap these for the real Back 9 Club palette and every
// composition, scene and transition picks them up.
export const COLORS = {
  ink: "#0A1A13",
  fairway: "#14422C",
  green: "#2E8B57",
  cream: "#F4EFE4",
  sand: "#D8C7A0",
  gold: "#C9A24B",
  white: "#FFFFFF",
} as const;

export const FONTS = {
  display: "Inter Tight",
  body: "Inter",
  /** Variable width: pair with fontStretch, e.g. "70%" for condensed. */
  condensed: "Archivo",
} as const;

// Type scale for a 1080px-wide frame (headline >= 84px, supporting >= 44px).
export const TYPE = {
  hero: 156,
  headline: 104,
  title: 72,
  body: 48,
  caption: 36,
} as const;
