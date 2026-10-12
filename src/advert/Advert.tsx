import { Audio } from "@remotion/media";
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Atmosphere } from "../teaser/components/Atmosphere";
import { FilmGrain } from "../teaser/components/FilmGrain";
import { kick, Scene } from "../teaser/components/time";
import { INK } from "../teaser/theme";
import { Access } from "./scenes/Access";
import { BallOpen } from "./scenes/BallOpen";
import { LogoFinale } from "./scenes/LogoFinale";
import { OpeningYear } from "./scenes/OpeningYear";
import { Statement } from "./scenes/Statement";
import { CUE, FPS } from "./timeline";

const curve = (t: number, times: number[], values: number[]) =>
  interpolate(t, times, values, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// Stage lighting across the whole film (hidden under the 3D shot at the start).
const atmosphereAt = (t: number) => ({
  t,
  glow:
    curve(
      t,
      [3.5, 3.7, 6.8, 7.3, 10.2, 10.6, 13.2, 13.7, 18],
      [0, 0.6, 0.55, 0.72, 0.6, 0.45, 0.4, 0.08, 0.12],
    ) +
    0.25 * kick(t, CUE.yearLand, 0.3),
  glowX: 50,
  glowY: curve(t, [3.6, 7, 10.4, 13.4], [42, 48, 50, 40]),
  beams: curve(
    t,
    [3.5, 3.7, 6.8, 7.3, 10.3, 10.6, 13.2, 13.8, 18],
    [0, 0.22, 0.22, 0.16, 0.16, 0.2, 0.2, 0.08, 0.1],
  ),
});

// THE BACK 9 CLUB: cinematic advert, rebuilt from the original reference.
// 18s, 1080x1920, 30fps. Cues live in timeline.json (shared with the audio).
export const Advert: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{ backgroundColor: INK.black }}>
      <Atmosphere {...atmosphereAt(t)} />

      <Scene name="1 · From darkness" from={0} to={3.6}>
        <BallOpen />
      </Scene>
      <Scene name="2 · Taking over" from={3.55} to={7.25}>
        <Statement />
      </Scene>
      <Scene name="3 · Opening early 2027" from={6.85} to={10.55}>
        <OpeningYear />
      </Scene>
      <Scene name="4 · Memberships & walk-ins" from={10.35} to={13.6}>
        <Access />
      </Scene>
      <Scene name="5 · Logo reveal" from={13.3} to={18}>
        <LogoFinale />
      </Scene>

      <FilmGrain opacity={0.07} />
      <Audio src={staticFile("audio/advert/mix.wav")} />
    </AbsoluteFill>
  );
};
