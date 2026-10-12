import React from "react";
import { AbsoluteFill } from "remotion";
import { EASE } from "../../motion/easing";
import { kick, lerp, prog, useTime } from "../../teaser/components/time";
import { DISPLAY, INK, LABEL } from "../../teaser/theme";
import { beatPulse, shakeAll, snap } from "../components/kinetics";
import { Punch } from "../components/Punch";
import { Ripple } from "../components/Ripple";
import { TYPE_SHADOW } from "../style";
import { CUE } from "../timeline";

const PANEL_H = 300;
const TOP_Y = 560;
const BOTTOM_Y = 1060;
const WORD_SIZE = 128;

const Panel: React.FC<{
  t: number;
  y: number;
  /** When the word lands; the panel arrives just before. */
  at: number;
  /** 0..1 slide-out progress. */
  exit: number;
  /** +1 slides in from the left, -1 from the right. */
  from: 1 | -1;
  label: string;
  children: React.ReactNode;
}> = ({ t, y, at, exit, from, label, children }) => {
  const enter = prog(t, at - 0.14, 0.32, EASE.outExpo);
  const x = (1 - enter) * -1100 * from + exit * 1100 * from;
  const edge = prog(t, at - 0.02, 0.3, EASE.outCubic);
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
      {/* A line of light races along the panel's top edge as the word lands. */}
      <div
        style={{
          position: "absolute",
          top: -1,
          left: from === 1 ? `${lerp(-20, 100, edge)}%` : undefined,
          right: from === -1 ? `${lerp(-20, 100, edge)}%` : undefined,
          width: 260,
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
          gap: 16,
        }}
      >
        <Ripple
          t={t}
          at={at + 0.05}
          text={label}
          style={{
            ...LABEL,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.34em",
            marginRight: "-0.34em",
            color: "#27B936",
          }}
        />
        <div style={{ filter: TYPE_SHADOW }}>
          <Punch t={t} at={at} from={1.4}>
            <div style={{ ...DISPLAY, fontSize: WORD_SIZE, color: INK.white }}>
              {children}
            </div>
          </Punch>
        </div>
      </div>
    </div>
  );
};

// Scene 4 (10.6-13.5s): two ways to play. Glass panels whip in from opposite
// sides and each word slams onto its panel on the beat, MEMBERSHIPS then
// WALK-INS, with the green ampersand popping on the 8th between them. The
// frame pulses on every beat while it holds; both panels whip away.
export const Access: React.FC = () => {
  const t = useTime();
  const exit = prog(t, CUE.accessOut, 0.25, EASE.inCubic);
  const amp = snap(t, CUE.amp, 5, 0.45);
  const hit =
    0.02 * (kick(t, CUE.memberships, 0.12) + kick(t, CUE.walkIns, 0.12)) +
    0.01 * beatPulse(t, CUE.walkIns + 0.3, CUE.accessOut);

  return (
    <AbsoluteFill
      style={{
        transform: `${shakeAll(t, [
          [CUE.memberships, 7],
          [CUE.walkIns, 7],
        ])} scale(${1 + hit})`,
      }}
    >
      <Panel
        t={t}
        y={TOP_Y}
        at={CUE.memberships}
        exit={exit}
        from={1}
        label="01 · Join"
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
          opacity: Math.min(1, amp * 3) * (1 - exit),
          transform: `scale(${lerp(0.3, 1, amp)}) rotate(${lerp(-25, 0, amp)}deg)`,
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
        t={t}
        y={BOTTOM_Y}
        at={CUE.walkIns}
        exit={exit}
        from={-1}
        label="02 · Drop in"
      >
        WALK-INS
      </Panel>
    </AbsoluteFill>
  );
};
