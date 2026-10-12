import { BEAT, CUE, FPS } from "../timeline";

/**
 * Under-damped spring step: 0 before `at`, lands in about 3 frames, overshoots
 * by ~10% and settles. Drives the word slams.
 */
export const snap = (t: number, at: number, hz = 4.5, damping = 0.6) => {
  const tau = t - at;
  if (tau <= 0) return 0;
  const w = 2 * Math.PI * hz;
  const wd = w * Math.sqrt(1 - damping * damping);
  return (
    1 -
    Math.exp(-damping * w * tau) *
      (Math.cos(wd * tau) + ((damping * w) / wd) * Math.sin(wd * tau))
  );
};

/** Camera shake after a hit: a fast, decaying wobble (px). */
export const shake = (t: number, at: number, amp = 10, decay = 0.08) => {
  const tau = t - at;
  if (tau < 0) return { x: 0, y: 0 };
  const e = amp * Math.exp(-tau / decay);
  return {
    x: e * Math.sin(2 * Math.PI * 19 * tau + 0.6),
    y: 0.7 * e * Math.sin(2 * Math.PI * 23 * tau + 2.1),
  };
};

/** Sum of several shakes, as a CSS translate. */
export const shakeAll = (
  t: number,
  hits: ReadonlyArray<readonly [at: number, amp: number]>,
) => {
  const s = hits.reduce(
    (acc, [at, amp]) => {
      const h = shake(t, at, amp);
      return { x: acc.x + h.x, y: acc.y + h.y };
    },
    { x: 0, y: 0 },
  );
  return `translate(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px)`;
};

const BEAT_FRAMES = Math.round(BEAT * FPS);
const GRID_FRAME = Math.round(CUE.strike * FPS);

/** 1 on every beat of the groove, decaying fast; 0 outside [from, to). */
export const beatPulse = (t: number, from: number, to: number) => {
  if (t < from || t >= to) return 0;
  const f = Math.round(t * FPS) - GRID_FRAME;
  const since = (((f % BEAT_FRAMES) + BEAT_FRAMES) % BEAT_FRAMES) / FPS;
  return Math.exp(-since / 0.09);
};
