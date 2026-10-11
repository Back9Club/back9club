import { Audio } from "@remotion/media";
import { TransitionSeries } from "@remotion/transitions";
import React from "react";
import { AbsoluteFill, staticFile, useVideoConfig } from "remotion";
import { TRANSITIONS } from "../motion/transitions";
import { FilmGrain } from "../teaser/components/FilmGrain";
import { DataChapter } from "./chapters/DataChapter";
import { DepthChapter } from "./chapters/DepthChapter";
import { FinaleChapter } from "./chapters/FinaleChapter";
import { FormChapter } from "./chapters/FormChapter";
import { TypeChapter } from "./chapters/TypeChapter";
import { Hud } from "./Hud";
import { CUTS, DURATION_IN_FRAMES, FPS } from "./timeline";

const CHAPTERS = [
  { name: "01 Type", Component: TypeChapter },
  { name: "02 Form", Component: FormChapter },
  { name: "03 Depth", Component: DepthChapter },
  { name: "04 Data", Component: DataChapter },
  { name: "05 Finale", Component: FinaleChapter },
];

// Transition into chapters 2..5, from the shared preset library.
const INTO = [
  TRANSITIONS.whipPan,
  TRANSITIONS.cardExpand,
  TRANSITIONS.cardStack,
  TRANSITIONS.iris,
];

// Solve sequence lengths so each transition is centred on its cut (a
// downbeat in the soundtrack). Chapter k starts at starts[k] (frames).
const transitionFrames = INTO.map((p) =>
  p.timing.getDurationInFrames({ fps: FPS }),
);
const starts = [
  0,
  ...CUTS.map(
    (cut, k) => Math.round(cut * FPS) - Math.floor(transitionFrames[k] / 2),
  ),
];
const durations = starts.map((s, k) =>
  k < starts.length - 1
    ? starts[k + 1] - s + transitionFrames[k]
    : DURATION_IN_FRAMES - s,
);

// FIFTEEN: a 15-second motion study that counts down its own runtime.
export const Fifteen: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <TransitionSeries>
        {CHAPTERS.map(({ name, Component }, k) => (
          <React.Fragment key={name}>
            {k > 0 ? (
              <TransitionSeries.Transition
                presentation={INTO[k - 1].presentation}
                timing={INTO[k - 1].timing}
              />
            ) : null}
            <TransitionSeries.Sequence
              name={name}
              durationInFrames={durations[k]}
              premountFor={fps}
            >
              <Component start={starts[k]} />
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}
      </TransitionSeries>
      <Hud />
      <FilmGrain opacity={0.06} />
      <Audio src={staticFile("audio/fifteen/mix.wav")} />
    </AbsoluteFill>
  );
};
