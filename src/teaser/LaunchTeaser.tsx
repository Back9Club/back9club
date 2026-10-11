import { Audio } from "@remotion/media";
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";
import { Atmosphere } from "./components/Atmosphere";
import { FilmGrain } from "./components/FilmGrain";
import { kick, Scene } from "./components/time";
import { BigStatement } from "./scenes/BigStatement";
import { BrandReveal } from "./scenes/BrandReveal";
import { FinalTeaser } from "./scenes/FinalTeaser";
import { HowToPlay } from "./scenes/HowToPlay";
import { Hook } from "./scenes/Hook";
import { Opening } from "./scenes/Opening";
import { INK } from "./theme";
import { CUE, FPS } from "./timeline";

export const launchTeaserSchema = z.object({
  /** Include the voiceover. Off = music + sound design only (unducked mix). */
  voiceover: z.boolean(),
});

type Props = z.infer<typeof launchTeaserSchema>;

const curve = (t: number, times: number[], values: number[]) =>
  interpolate(t, times, values, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// Lighting across the whole film, so the stage never "cuts" between scenes.
const atmosphereAt = (t: number) => ({
  t,
  glow:
    curve(
      t,
      [0, 1.8, 3.4, 4.5, 6.3, 6.8, 9.3, 12.3, 12.45, 16.2, 16.8, 19.5],
      [0.08, 0.3, 0.26, 0.75, 0.7, 0.62, 0.45, 0.18, 0.9, 0.85, 0.28, 0.34],
    ) +
    0.3 * kick(t, CUE.golfChange, 0.3) +
    0.25 * kick(t, CUE.digitsLand, 0.3) +
    0.2 * kick(t, CUE.finalHit, 0.5),
  glowX: 50,
  glowY: curve(t, [0, 3.5, 12.4, 16.6], [52, 45, 48, 42]),
  beams: curve(
    t,
    [0, 3.5, 4.5, 6.5, 9.3, 12.3, 12.45, 16.2, 16.7, 19.5],
    [0.04, 0.14, 0.34, 0.3, 0.24, 0.12, 0.85, 0.75, 0.1, 0.16],
  ),
});

// THE BACK 9 CLUB: cinematic launch teaser. 19.5s, 1080x1920, 30fps.
// Every cue lives in timeline.json, shared with the audio build.
export const LaunchTeaser: React.FC<Props> = ({ voiceover }) => {
  const t = useCurrentFrame() / FPS;

  return (
    <AbsoluteFill style={{ backgroundColor: INK.black }}>
      <Atmosphere {...atmosphereAt(t)} />

      <Scene name="1 · Hook" from={0} to={3.7}>
        <Hook />
      </Scene>
      <Scene name="2 · Brand reveal" from={3.45} to={6.8}>
        <BrandReveal />
      </Scene>
      <Scene name="3 · Opening 2027" from={6.25} to={9.5}>
        <Opening />
      </Scene>
      <Scene name="4 · Memberships / walk-ins" from={9.25} to={12.45}>
        <HowToPlay />
      </Scene>
      <Scene name="5 · Big statement" from={12.38} to={16.65}>
        <BigStatement />
      </Scene>
      <Scene name="6 · Final teaser" from={16.55} to={19.5}>
        <FinalTeaser />
      </Scene>

      <FilmGrain />

      {voiceover ? (
        <>
          <Audio src={staticFile("audio/stems/music.wav")} />
          <Audio src={staticFile("audio/stems/sfx.wav")} />
          <Audio src={staticFile("audio/stems/vo.wav")} />
        </>
      ) : (
        <Audio src={staticFile("audio/mix-no-vo.wav")} />
      )}
    </AbsoluteFill>
  );
};
