import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import React, { useId, useMemo } from "react";
import { AbsoluteFill } from "remotion";

export type WhipPanDirection =
  "from-left" | "from-right" | "from-top" | "from-bottom";

export type WhipPanProps = {
  direction?: WhipPanDirection;
  /** Peak directional blur in px, reached halfway through. 0 disables it. */
  blur?: number;
};

// Overlap the two scenes by a hair so no seam shows between them.
const EPSILON = 0.02;

// A push where both scenes travel together, with a directional motion blur
// (along the direction of travel) that peaks mid-move, like a fast camera pan.
const WhipPanPresentation: React.FC<
  TransitionPresentationComponentProps<WhipPanProps>
> = ({
  children,
  presentationProgress: p,
  presentationDirection,
  passedProps: { direction = "from-right", blur = 70 },
}) => {
  const filterId = `whip-pan-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const horizontal = direction === "from-left" || direction === "from-right";
  // +1 when the incoming scene arrives from the positive side (right/bottom).
  const sign =
    direction === "from-right" || direction === "from-bottom" ? 1 : -1;
  const amount = blur * Math.sin(Math.PI * p);
  const showBlur = amount > 0.5;

  const style: React.CSSProperties = useMemo(() => {
    const offset =
      presentationDirection === "exiting"
        ? -sign * p * 100
        : sign * (100 - p * 100 - (p === 1 ? 0 : EPSILON));
    const axis = horizontal ? "X" : "Y";
    return {
      transform: `translate${axis}(${offset}%)`,
      filter: showBlur ? `url(#${filterId})` : undefined,
    };
  }, [filterId, horizontal, p, presentationDirection, showBlur, sign]);

  return (
    <>
      {showBlur ? (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <defs>
            <filter
              id={filterId}
              x="0"
              y="0"
              width="100%"
              height="100%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur
                stdDeviation={horizontal ? `${amount} 0` : `0 ${amount}`}
                edgeMode="duplicate"
              />
            </filter>
          </defs>
        </svg>
      ) : null}
      <AbsoluteFill style={style}>{children}</AbsoluteFill>
    </>
  );
};

export const whipPan = (
  props: WhipPanProps = {},
): TransitionPresentation<WhipPanProps> => ({
  component: WhipPanPresentation,
  props,
});
