import data from "./timeline.json";

// Shared with scripts/advert/build_audio.py. Times in seconds.
export const FPS = data.fps;
export const DURATION_IN_FRAMES = data.durationInFrames;
export const BALL_SHOT_SECONDS = data.ballShotSeconds;
export const CUE = data.cues;
/** One beat of the groove (100 BPM), which runs on a grid from the strike. */
export const BEAT = 60 / data.bpm;
/** How the 2027 digits spin and lock (the audio ratchet uses the same values). */
export const YEAR_ROLL = data.yearRoll;
