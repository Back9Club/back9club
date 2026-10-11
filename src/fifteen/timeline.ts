import data from "./timeline.json";

// Shared with scripts/audio/build_fifteen.py. Times in seconds.
export const FPS = data.fps;
export const DURATION_IN_FRAMES = data.durationInFrames;
export const BEAT = 60 / data.bpm;
export const CUTS = data.cuts;
export const CUE = data.cues;
