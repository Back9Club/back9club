import type {
  TransitionPresentation,
  TransitionTiming,
} from "@remotion/transitions";
import { blurSlide } from "@remotion/transitions/blur-slide";
import { bookFlip } from "@remotion/transitions/book-flip";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { crossZoom } from "@remotion/transitions/cross-zoom";
import { crosswarp } from "@remotion/transitions/crosswarp";
import { dissolve } from "@remotion/transitions/dissolve";
import { dreamyZoom } from "@remotion/transitions/dreamy-zoom";
import { fade } from "@remotion/transitions/fade";
import { filmBurn } from "@remotion/transitions/film-burn";
import { flip } from "@remotion/transitions/flip";
import { iris } from "@remotion/transitions/iris";
import { linearBlur } from "@remotion/transitions/linear-blur";
import { pushCut } from "@remotion/transitions/push-cut";
import { ripple } from "@remotion/transitions/ripple";
import { slide } from "@remotion/transitions/slide";
import { swap } from "@remotion/transitions/swap";
import { wipe } from "@remotion/transitions/wipe";
import { zoomBlur } from "@remotion/transitions/zoom-blur";
import { zoomInOut } from "@remotion/transitions/zoom-in-out";
import { sec, VIDEO } from "../config";
import { blurDissolve } from "./presentations/blur-dissolve";
import { cardExpand } from "./presentations/card-expand";
import { cardStack } from "./presentations/card-stack";
import { whipPan } from "./presentations/whip-pan";
import { zoomThrough } from "./presentations/zoom-through";
import { TIMING } from "./timing";

export type TransitionPreset = {
  readonly label: string;
  // Each presentation has its own props type; the catalog only needs to pass
  // them through to <TransitionSeries.Transition>.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly presentation: TransitionPresentation<any>;
  readonly timing: TransitionTiming;
  /**
   * "css": works everywhere, including Studio preview in any browser.
   * "webgl": shader transition built on HTML-in-canvas. Renders fine from the
   * CLI; previewing in Studio needs Chrome 149+ with
   * chrome://flags/#canvas-draw-element enabled.
   */
  readonly engine: "css" | "webgl";
};

const css = <P extends Record<string, unknown>>(
  label: string,
  presentation: TransitionPresentation<P>,
  timing: TransitionTiming,
): TransitionPreset => ({ label, presentation, timing, engine: "css" });

const webgl = <P extends Record<string, unknown>>(
  label: string,
  presentation: TransitionPresentation<P>,
  timing: TransitionTiming,
): TransitionPreset => ({ label, presentation, timing, engine: "webgl" });

// Ready-to-use transitions with tuned timing. Use as:
//   const t = TRANSITIONS.whipPan;
//   <TransitionSeries.Transition presentation={t.presentation} timing={t.timing} />
export const TRANSITIONS = {
  // --- CSS: preview anywhere ---------------------------------------------
  fade: css("Fade", fade(), TIMING.gentle()),
  blurDissolve: css("Blur Dissolve", blurDissolve(), TIMING.gentle()),
  zoomThrough: css("Zoom Through", zoomThrough(), TIMING.expo()),
  whipPan: css(
    "Whip Pan",
    whipPan({ direction: "from-right" }),
    TIMING.snappy(sec(0.5)),
  ),
  whipPanUp: css(
    "Whip Pan Up",
    whipPan({ direction: "from-bottom" }),
    TIMING.snappy(sec(0.5)),
  ),
  slideUp: css("Slide Up", slide({ direction: "from-bottom" }), TIMING.expo()),
  slideLeft: css(
    "Slide Left",
    slide({ direction: "from-right" }),
    TIMING.expo(),
  ),
  cardStack: css(
    "Card Stack",
    cardStack({ direction: "from-bottom" }),
    TIMING.expo(sec(0.8)),
  ),
  cardExpand: css("Card Expand", cardExpand(), TIMING.expo(sec(0.8))),
  wipe: css("Wipe", wipe({ direction: "from-bottom-left" }), TIMING.expo()),
  iris: css(
    "Iris",
    iris({ width: VIDEO.width, height: VIDEO.height }),
    TIMING.expo(),
  ),
  clockWipe: css(
    "Clock Wipe",
    clockWipe({ width: VIDEO.width, height: VIDEO.height }),
    TIMING.smooth(sec(0.8)),
  ),
  flip: css("Flip", flip({ direction: "from-right" }), TIMING.spring()),
  pushCut: css("Push Cut", pushCut(), TIMING.smooth()),

  // --- WebGL shaders: render anywhere, Studio preview needs Chrome flag ---
  blurSlide: webgl(
    "Blur Slide",
    blurSlide({ direction: "from-right" }),
    TIMING.expo(),
  ),
  linearBlur: webgl("Linear Blur", linearBlur({}), TIMING.smooth()),
  zoomBlur: webgl("Zoom Blur", zoomBlur({}), TIMING.expo()),
  crossZoom: webgl("Cross Zoom", crossZoom({}), TIMING.expo()),
  dreamyZoom: webgl("Dreamy Zoom", dreamyZoom({}), TIMING.gentle()),
  zoomInOut: webgl("Zoom In Out", zoomInOut({}), TIMING.expo()),
  dissolve: webgl("Burn Dissolve", dissolve({}), TIMING.gentle()),
  filmBurn: webgl("Film Burn", filmBurn({}), TIMING.gentle()),
  crosswarp: webgl("Crosswarp", crosswarp({}), TIMING.smooth()),
  ripple: webgl("Ripple", ripple({}), TIMING.gentle()),
  swap: webgl("Swap", swap({}), TIMING.expo(sec(0.9))),
  bookFlip: webgl(
    "Book Flip",
    bookFlip({ direction: "from-right" }),
    TIMING.smooth(sec(0.9)),
  ),
} as const satisfies Record<string, TransitionPreset>;

export type TransitionName = keyof typeof TRANSITIONS;

export const TRANSITION_NAMES = Object.keys(TRANSITIONS) as TransitionName[];

export const CSS_TRANSITIONS = TRANSITION_NAMES.filter(
  (name) => TRANSITIONS[name].engine === "css",
);

export const WEBGL_TRANSITIONS = TRANSITION_NAMES.filter(
  (name) => TRANSITIONS[name].engine === "webgl",
);
