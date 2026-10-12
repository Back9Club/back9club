import React from "react";
import { AbsoluteFill } from "remotion";
import { EASE } from "../../motion/easing";
import { MaskLine } from "../../teaser/components/MaskLine";
import { kick, lerp, prog, useTime } from "../../teaser/components/time";
import { DISPLAY, INK, LABEL } from "../../teaser/theme";
import { TYPE_SHADOW } from "../style";
import { CUE } from "../timeline";

const PANEL_H = 300;
const TOP_Y = 560;
const BOTTOM_Y = 1060;
const WORD_SIZE = 128;

const Panel: React.FC<{
  y: number;
  /** 0..1 slide-in progress. */
  enter: number;
  /** 0..1 slide-out progress. */
  exit: number;
  /** +1 slides in from the left, -1 from the right. */
  from: 1 | -1;
  index: string;
  label: string;
  wordIn: number;
  children: React.ReactNode;
}> = ({ y, enter, exit, from, index, label, wordIn, children }) => {
  const x = (1 - enter) * -1100 * from + exit * 1100 * from;
  const edge = prog(enter, 0.55, 0.45, EASE.linear);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: y,
        width: 1080,
        height: PANEL_H,
        transform: `translateX(${x}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(${from === 1 ? 90 : 270}deg, rgba(16,42,32,0) 0%, rgba(16,42,32,0.85) 45%, rgba(16,42,32,0.55) 100%)`,
          borderTop: "1px solid rgba(244,245,240,0.10)",
          borderBottom: "1px solid rgba(244,245,240,0.06)",
        }}
      />
      {/* A line of light travels along the panel's top edge as it lands. */}
      <div
        style={{
          position: "absolute",
          top: -1,
          left: from === 1 ? `${lerp(-20, 100, edge)}%` : undefined,
          right: from === -1 ? `${lerp(-20, 100, edge)}%` : undefined,
          width: 220,
          height: 2,
          background:
            "linear-gradient(90deg, rgba(155,245,191,0), #9BF5BF, rgba(155,245,191,0))",
          boxShadow: "0 0 14px rgba(43,212,110,0.8)",
          opacity: Math.sin(Math.PI * edge),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
        }}
      >
        <div
          style={{
            ...LABEL,
            fontSize: 22,
            letterSpacing: "0.42em",
            marginRight: "-0.42em",
            color: "#27B936",
            opacity: wordIn,
          }}
        >
          {index} · {label}
        </div>
        <div style={{ filter: TYPE_SHADOW }}>
          <MaskLine progress={wordIn}>
            <div style={{ ...DISPLAY, fontSize: WORD_SIZE, color: INK.white }}>
              {children}
            </div>
          </MaskLine>
        </div>
      </div>
    </div>
  );
};

// Scene 4 (10.4-13.4s): two ways to play. Glass panels sweep in from opposite
// sides on the beat, MEMBERSHIPS then WALK-INS, joined by a green ampersand;
// both slide away before the logo.
export const Access: React.FC = () => {
  const t = useTime();
  const exit = prog(t, CUE.accessOut, 0.35, EASE.inCubic);
  const amp = prog(t, CUE.memberships + 0.3, 0.5, EASE.outBack);
  const hit =
    0.012 * (kick(t, CUE.memberships, 0.16) + kick(t, CUE.walkIns, 0.16));

  return (
    <AbsoluteFill style={{ transform: `scale(${1 + hit})` }}>
      <Panel
        y={TOP_Y}
        enter={prog(t, CUE.memberships - 0.18, 0.55, EASE.outExpo)}
        exit={exit}
        from={1}
        index="01"
        label="Join"
        wordIn={prog(t, CUE.memberships, 0.55)}
      >
        MEMBERSHIPS
      </Panel>
      <div
        style={{
          position: "absolute",
          top: (TOP_Y + PANEL_H + BOTTOM_Y) / 2 - 80,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: amp * (1 - exit),
          transform: `scale(${lerp(0.6, 1, amp)})`,
        }}
      >
        <div
          style={{
            ...DISPLAY,
            fontSize: 150,
            color: "#27B936",
            lineHeight: 1,
            textShadow: "0 0 40px rgba(39,185,54,0.45)",
          }}
        >
          &amp;
        </div>
      </div>
      <Panel
        y={BOTTOM_Y}
        enter={prog(t, CUE.walkIns - 0.18, 0.55, EASE.outExpo)}
        exit={exit}
        from={-1}
        index="02"
        label="Drop in"
        wordIn={prog(t, CUE.walkIns, 0.55)}
      >
        WALK-INS
      </Panel>
    </AbsoluteFill>
  );
};
