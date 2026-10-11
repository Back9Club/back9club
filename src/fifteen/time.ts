import { useCurrentFrame } from "remotion";
import { FPS } from "./timeline";

/** Absolute time (s) inside a chapter that starts at `start` (frames). */
export const useChapterTime = (start: number) =>
  (useCurrentFrame() + start) / FPS;
