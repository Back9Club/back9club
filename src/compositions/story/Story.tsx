import { TransitionSeries } from "@remotion/transitions";
import React from "react";
import type { CalculateMetadataFunction } from "remotion";
import { useVideoConfig } from "remotion";
import { z } from "zod";
import { sec } from "../../config";
import { getSeriesDuration } from "../../motion/duration";
import {
  TRANSITION_NAMES,
  TRANSITIONS,
  type TransitionName,
} from "../../motion/transitions";
import { StoryScene } from "./StoryScene";

export const storySchema = z.object({
  theme: z.enum(["dark", "light"]),
  sceneSeconds: z.number().min(1.5).max(10).step(0.5),
  scenes: z
    .array(
      z.object({
        kicker: z.string(),
        headline: z.string(),
        body: z.string(),
        /** Transition into this scene (ignored on the first scene). */
        transitionIn: z.enum(
          TRANSITION_NAMES as [TransitionName, ...TransitionName[]],
        ),
      }),
    )
    .min(1),
});

export type StoryProps = z.infer<typeof storySchema>;

export const storyDefaults: StoryProps = {
  theme: "dark",
  sceneSeconds: 2.5,
  scenes: [
    {
      kicker: "The Back 9 Club",
      headline: "Golf Studio",
      body: "",
      transitionIn: "fade",
    },
    {
      kicker: "01",
      headline: "Your first point",
      body: "Edit every line in the Studio props panel.",
      transitionIn: "whipPan",
    },
    {
      kicker: "02",
      headline: "Your second point",
      body: "Pick a transition for each scene.",
      transitionIn: "cardStack",
    },
    {
      kicker: "03",
      headline: "Your third point",
      body: "Every scene is 1080×1920 (9:16).",
      transitionIn: "zoomThrough",
    },
    {
      kicker: "The Back 9 Club",
      headline: "See you on the tee",
      body: "",
      transitionIn: "cardExpand",
    },
  ],
};

// Template for vertical social videos: a list of text scenes joined by
// transitions picked per scene from the TRANSITIONS catalog.
export const Story: React.FC<StoryProps> = ({
  theme,
  sceneSeconds,
  scenes,
}) => {
  const { fps } = useVideoConfig();

  return (
    <TransitionSeries>
      {scenes.map((scene, i) => (
        <React.Fragment key={i}>
          {i > 0 ? (
            <TransitionSeries.Transition
              presentation={TRANSITIONS[scene.transitionIn].presentation}
              timing={TRANSITIONS[scene.transitionIn].timing}
            />
          ) : null}
          <TransitionSeries.Sequence
            name={scene.headline}
            durationInFrames={sec(sceneSeconds)}
            premountFor={fps}
          >
            <StoryScene
              kicker={scene.kicker}
              headline={scene.headline}
              body={scene.body}
              theme={theme}
            />
          </TransitionSeries.Sequence>
        </React.Fragment>
      ))}
    </TransitionSeries>
  );
};

export const calculateStoryMetadata: CalculateMetadataFunction<StoryProps> = ({
  props,
}) => ({
  durationInFrames: getSeriesDuration(
    props.scenes.map(() => sec(props.sceneSeconds)),
    props.scenes.slice(1).map((s) => TRANSITIONS[s.transitionIn].timing),
  ),
});
