import React, { useId } from "react";

// Directional (one-axis) Gaussian blur for fast-moving elements. Fakes a
// camera shutter: pass a blur proportional to the element's speed.
export const MotionBlur: React.FC<{
  /** Blur along the axis of travel, in px. */
  amount: number;
  axis?: "x" | "y";
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ amount, axis = "y", children, style }) => {
  const id = `mb-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const active = amount > 0.3;
  return (
    <div style={{ ...style, filter: active ? `url(#${id})` : undefined }}>
      {active ? (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={id} x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur
              stdDeviation={axis === "y" ? `0 ${amount}` : `${amount} 0`}
            />
          </filter>
        </svg>
      ) : null}
      {children}
    </div>
  );
};
