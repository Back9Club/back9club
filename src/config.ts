// Every composition in this project is vertical 9:16.
// Spread VIDEO onto each <Composition> instead of writing sizes by hand:
//   <Composition id="..." component={...} {...VIDEO} durationInFrames={...} />
export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

// Keep key content clear of the UI that Reels / TikTok / Shorts draw on top
// of the video (profile + caption at the bottom, header at the top, action
// buttons on the right).
export const SAFE_AREA = {
  top: 250,
  bottom: 400,
  left: 90,
  right: 140,
} as const;

// Converts seconds to frames at the project frame rate.
export const sec = (seconds: number) => Math.round(seconds * VIDEO.fps);
