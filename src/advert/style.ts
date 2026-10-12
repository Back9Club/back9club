// Depth shadow for type revealed through a MaskLine. It is a filter on the
// element around the mask, so it follows the visible glyphs. A text-shadow
// inside the mask gets clipped by the slot and shows as a dark box.
export const TYPE_SHADOW =
  "drop-shadow(0 3px 2px rgba(0,0,0,0.5)) drop-shadow(0 22px 34px rgba(0,0,0,0.6))";
