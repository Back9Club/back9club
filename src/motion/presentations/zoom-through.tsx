import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate } from "remotion";

export type ZoomThroughProps = {
  /** Scale the outgoing scene grows to. */
  exitScale?: number;
  /** Scale the incoming scene grows from. */
  enterScale?: number;
  /** Blur in px applied at the extremes (fakes motion blur). 0 disables it. */
  blur?: number;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Both scenes scale up, as if the camera is flying forward through the cut.
// The incoming scene fades in on top, so there is never a dip to black.
const ZoomThroughPresentation: React.FC<
  TransitionPresentationComponentProps<ZoomThroughProps>
> = ({
  children,
  presentationProgress: p,
  presentationDirection,
  passedProps: { exitScale = 1.4, enterScale = 0.75, blur = 14 },
}) => {
  const style: React.CSSProperties = useMemo(() => {
    if (presentationDirection === "exiting") {
      return {
        transform: `scale(${interpolate(p, [0, 1], [1, exitScale])})`,
        filter:
          blur > 0 ? `blur(${interpolate(p, [0, 1], [0, blur])}px)` : undefined,
      };
    }

    return {
      transform: `scale(${interpolate(p, [0, 1], [enterScale, 1])})`,
      opacity: interpolate(p, [0, 0.6], [0, 1], clamp),
      filter:
        blur > 0 ? `blur(${interpolate(p, [0, 1], [blur, 0])}px)` : undefined,
    };
  }, [blur, enterScale, exitScale, p, presentationDirection]);

  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

export const zoomThrough = (
  props: ZoomThroughProps = {},
): TransitionPresentation<ZoomThroughProps> => ({
  component: ZoomThroughPresentation,
  props,
});
