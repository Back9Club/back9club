import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate } from "remotion";

export type BlurDissolveProps = {
  /** Peak blur in px. */
  blur?: number;
  /** Subtle scale drift for depth. 1 disables it. */
  scale?: number;
};

// A crossfade where the outgoing scene melts into a blur and the incoming
// scene resolves out of one. Works in every browser (no WebGL needed).
const BlurDissolvePresentation: React.FC<
  TransitionPresentationComponentProps<BlurDissolveProps>
> = ({
  children,
  presentationProgress: p,
  presentationDirection,
  passedProps: { blur = 30, scale = 1.05 },
}) => {
  const style: React.CSSProperties = useMemo(() => {
    if (presentationDirection === "exiting") {
      return {
        transform: `scale(${interpolate(p, [0, 1], [1, scale])})`,
        filter: `blur(${interpolate(p, [0, 1], [0, blur])}px)`,
      };
    }

    return {
      transform: `scale(${interpolate(p, [0, 1], [scale, 1])})`,
      filter: `blur(${interpolate(p, [0, 1], [blur, 0])}px)`,
      opacity: p,
    };
  }, [blur, p, presentationDirection, scale]);

  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

export const blurDissolve = (
  props: BlurDissolveProps = {},
): TransitionPresentation<BlurDissolveProps> => ({
  component: BlurDissolvePresentation,
  props,
});
