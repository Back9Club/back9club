import data from "./timeline.json";

// Single source of truth for the teaser's timing, shared with the audio
// builder (scripts/audio/build_audio.py). All values are in seconds.
export const FPS = data.fps;
export const DURATION_IN_FRAMES = data.durationInFrames;
export const BEAT = 60 / data.bpm;
export const CUE = data.cues;
export const SCENES = data.scenes;
export const VO_LINES = data.vo;

export const toFrame = (seconds: number) => Math.round(seconds * FPS);
