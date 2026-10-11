import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate } from "remotion";

export type CardStackDirection =
  "from-bottom" | "from-top" | "from-left" | "from-right";

export type CardStackProps = {
  direction?: CardStackDirection;
  /** Corner radius (px) of the incoming card while it travels. */
  radius?: number;
  /** Scale the outgoing scene recedes to. */
  recede?: number;
  /** How dark the outgoing scene gets (0 to 1). */
  dim?: number;
};

// The incoming scene slides in as a card on top of the outgoing scene, which
// recedes and dims underneath. Feels native on vertical video (like a story
// or app screen being pushed). Scenes need an opaque background.
const CardStackPresentation: React.FC<
  TransitionPresentationComponentProps<CardStackProps>
> = ({
  children,
  presentationProgress: p,
  presentationDirection,
  passedProps: {
    direction = "from-bottom",
    radius = 56,
    recede = 0.9,
    dim = 0.55,
  },
}) => {
  const horizontal = direction === "from-left" || direction === "from-right";
  const sign =
    direction === "from-right" || direction === "from-bottom" ? 1 : -1;
  const axis = horizontal ? "X" : "Y";

  const outer: React.CSSProperties = useMemo(() => {
    if (presentationDirection === "exiting") {
      return {
        transform: `translate${axis}(${-sign * 8 * p}%) scale(${interpolate(p, [0, 1], [1, recede])})`,
        borderRadius: radius * p,
        overflow: "hidden",
      };
    }
    return {
      transform: `translate${axis}(${sign * 100 * (1 - p)}%)`,
      // Rounded while travelling, square once it lands.
      borderRadius: interpolate(p, [0.6, 1], [radius, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
      overflow: "hidden",
      boxShadow: `0 0 120px rgba(0, 0, 0, ${0.45 * (1 - p)})`,
    };
  }, [axis, p, presentationDirection, radius, recede, sign]);

  return (
    <AbsoluteFill style={outer}>
      {children}
      {presentationDirection === "exiting" ? (
        <AbsoluteFill style={{ backgroundColor: "black", opacity: dim * p }} />
      ) : null}
    </AbsoluteFill>
  );
};

export const cardStack = (
  props: CardStackProps = {},
): TransitionPresentation<CardStackProps> => ({
  component: CardStackPresentation,
  props,
});
