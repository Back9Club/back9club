import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate } from "remotion";

export type CardExpandProps = {
  /** Size of the card the incoming scene starts as (fraction of the frame). */
  from?: number;
  /** Corner radius (px) of the card while it grows. */
  radius?: number;
  /** Extra zoom on the incoming content that settles as it opens. */
  parallax?: number;
  /** How dark the outgoing scene gets (0 to 1). */
  dim?: number;
};

// The incoming scene opens out of a rounded card in the middle of the frame,
// its content settling from a slight zoom (parallax) as the mask expands.
const CardExpandPresentation: React.FC<
  TransitionPresentationComponentProps<CardExpandProps>
> = ({
  children,
  presentationProgress: p,
  presentationDirection,
  passedProps: { from = 0.35, radius = 64, parallax = 0.18, dim = 0.5 },
}) => {
  const outer: React.CSSProperties = useMemo(() => {
    if (presentationDirection === "exiting") {
      return { transform: `scale(${interpolate(p, [0, 1], [1, 0.94])})` };
    }
    const inset = ((1 - from) / 2) * (1 - p) * 100;
    const r = interpolate(p, [0.7, 1], [radius, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return { clipPath: `inset(${inset}% round ${r}px)` };
  }, [from, p, presentationDirection, radius]);

  const inner: React.CSSProperties = useMemo(
    () =>
      presentationDirection === "entering"
        ? { transform: `scale(${1 + parallax * (1 - p)})` }
        : {},
    [p, parallax, presentationDirection],
  );

  return (
    <AbsoluteFill style={outer}>
      <AbsoluteFill style={inner}>{children}</AbsoluteFill>
      {presentationDirection === "exiting" ? (
        <AbsoluteFill style={{ backgroundColor: "black", opacity: dim * p }} />
      ) : null}
    </AbsoluteFill>
  );
};

export const cardExpand = (
  props: CardExpandProps = {},
): TransitionPresentation<CardExpandProps> => ({
  component: CardExpandPresentation,
  props,
});
