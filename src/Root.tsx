import "./fonts";
import { Composition, Folder } from "remotion";
import {
  calculateShowcaseMetadata,
  showcaseSchema,
  TransitionShowcase,
} from "./compositions/showcase/TransitionShowcase";
import {
  calculateStoryMetadata,
  Story,
  storyDefaults,
  storySchema,
} from "./compositions/story/Story";
import { VIDEO } from "./config";

// Each <Composition> is an entry in the sidebar.
// Every composition is 9:16 (1080×1920 @ 30fps): always spread {...VIDEO}.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Story"
        component={Story}
        {...VIDEO}
        durationInFrames={300}
        schema={storySchema}
        defaultProps={storyDefaults}
        calculateMetadata={calculateStoryMetadata}
      />
      <Folder name="Showcase">
        <Composition
          id="TransitionsCSS"
          component={TransitionShowcase}
          {...VIDEO}
          durationInFrames={300}
          schema={showcaseSchema}
          defaultProps={{ engine: "css" as const }}
          calculateMetadata={calculateShowcaseMetadata}
        />
        <Composition
          id="TransitionsWebGL"
          component={TransitionShowcase}
          {...VIDEO}
          durationInFrames={300}
          schema={showcaseSchema}
          defaultProps={{ engine: "webgl" as const }}
          calculateMetadata={calculateShowcaseMetadata}
        />
      </Folder>
    </>
  );
};
