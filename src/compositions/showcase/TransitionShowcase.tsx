import { TransitionSeries } from "@remotion/transitions";
import React from "react";
import type { CalculateMetadataFunction } from "remotion";
import { useVideoConfig } from "remotion";
import { z } from "zod";
import { LightLeakOverlay } from "../../components/LightLeakOverlay";
import { sec } from "../../config";
import { getSeriesDuration } from "../../motion/duration";
import {
  CSS_TRANSITIONS,
  TRANSITIONS,
  WEBGL_TRANSITIONS,
} from "../../motion/transitions";
import { DemoCard } from "./DemoCard";

export const showcaseSchema = z.object({
  engine: z.enum(["css", "webgl"]),
});

type ShowcaseProps = z.infer<typeof showcaseSchema>;

const SCENE = sec(1.5);
const LIGHT_LEAK = sec(1);

const pad = (n: number) => String(n).padStart(2, "0");

const getNames = (engine: ShowcaseProps["engine"]) =>
  engine === "css" ? CSS_TRANSITIONS : WEBGL_TRANSITIONS;

const NOTES = {
  css: "CSS · previews in any browser",
  webgl: "WebGL shader · needs Chrome flag to preview",
} as const;

// Plays every transition preset in TRANSITIONS back to back, each scene
// labelled with the transition that brought it in. The CSS reel ends on a
// light-leak overlay cut.
export const TransitionShowcase: React.FC<ShowcaseProps> = ({ engine }) => {
  const { fps } = useVideoConfig();
  const names = getNames(engine);

  return (
    <TransitionSeries>
      <TransitionSeries.Sequence
        name="Intro"
        durationInFrames={SCENE}
        premountFor={fps}
      >
        <DemoCard
          index={0}
          kicker="Back 9 Club · Motion"
          title={engine === "css" ? "CSS Transitions" : "Shader Transitions"}
          note={`${names.length} presets · 1080×1920`}
        />
      </TransitionSeries.Sequence>
      {names.map((name, i) => (
        <React.Fragment key={name}>
          <TransitionSeries.Transition
            presentation={TRANSITIONS[name].presentation}
            timing={TRANSITIONS[name].timing}
          />
          <TransitionSeries.Sequence
            name={TRANSITIONS[name].label}
            durationInFrames={SCENE}
            premountFor={fps}
          >
            <DemoCard
              index={i + 1}
              kicker={`Transition ${pad(i + 1)} / ${pad(names.length)}`}
              title={TRANSITIONS[name].label}
              note={NOTES[engine]}
            />
          </TransitionSeries.Sequence>
        </React.Fragment>
      ))}
      {engine === "css" ? (
        <>
          <TransitionSeries.Overlay
            durationInFrames={LIGHT_LEAK}
            premountFor={fps}
          >
            <LightLeakOverlay seed={3} />
          </TransitionSeries.Overlay>
          <TransitionSeries.Sequence
            name="Light Leak"
            durationInFrames={SCENE}
            premountFor={fps}
          >
            <DemoCard
              index={names.length + 1}
              kicker="Overlay"
              title="Light Leak Cut"
              note="WebGL2 · previews in any browser"
            />
          </TransitionSeries.Sequence>
        </>
      ) : null}
    </TransitionSeries>
  );
};

export const calculateShowcaseMetadata: CalculateMetadataFunction<
  ShowcaseProps
> = ({ props }) => {
  const names = getNames(props.engine);
  const scenes = 1 + names.length + (props.engine === "css" ? 1 : 0);
  return {
    durationInFrames: getSeriesDuration(
      Array.from({ length: scenes }, () => SCENE),
      names.map((name) => TRANSITIONS[name].timing),
    ),
  };
};
