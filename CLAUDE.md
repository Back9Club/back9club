# Back 9 Club Motion

Remotion 4 project for vertical (9:16) motion graphics. React + TypeScript.

## Rules

- **Every composition is 9:16: 1080×1920 @ 30fps.** Spread `{...VIDEO}` from
  `src/config.ts` onto each `<Composition>`; never hard-code another size.
- Keep text and key visuals inside `SAFE_AREA` (use `<SafeArea>`), clear of
  the Reels / TikTok / Shorts UI.
- Transitions: use `<TransitionSeries>` with presets from `TRANSITIONS`
  (`src/motion/transitions.ts`). Each preset bundles a presentation and a
  tuned timing. Put `premountFor={fps}` on every `TransitionSeries.Sequence`.
- Motion: use `EASE` / `SPRING` (`src/motion/easing.ts`) and `TIMING`
  (`src/motion/timing.ts`). Avoid linear motion.
- Durations: transitions overlap scenes. Compute totals with
  `getSeriesDuration()` in a `calculateMetadata` function.
- Prefer `engine: "css"` transitions. `"webgl"` ones render fine but only
  preview in Studio on Chrome 149+ with `chrome://flags/#canvas-draw-element`.
- Colors and type sizes: `src/theme.ts`. Fonts: `src/fonts.ts` (Inter Tight
  for display, Inter for body), bundled from npm `@fontsource-variable/*`
  packages. Add new fonts the same way, not with `@remotion/google-fonts`,
  because sandbox renders can't reach Google Fonts.
- Keep all `remotion` / `@remotion/*` packages on the exact same version.
  Upgrade with `npx remotion upgrade` (see the `remotion-upgrade` skill).

## Layout

- `src/Root.tsx`: composition registry (`Story`, `Showcase/TransitionsCSS`,
  `Showcase/TransitionsWebGL`)
- `src/motion/`: easing, timing, the `TRANSITIONS` catalog, and custom
  presentations (`zoomThrough`, `blurDissolve`, `whipPan`, `cardStack`,
  `cardExpand`)
- `src/components/`: `Background` (gradient + anti-banding grain),
  `SafeArea`, `RevealText` (kinetic type), `LightLeakOverlay`
- `src/compositions/`: `story/` (editable template driven by a zod schema)
  and `showcase/` (plays every transition)

## Commands

- `npm run dev`: Remotion Studio
- `npm run lint`: ESLint + `tsc`
- `npx remotion render src/index.ts <CompositionId> out/<name>.mp4`
- `npx remotion still src/index.ts <CompositionId> out/<name>.png --frame=<n>`
- `npx remotion render src/index.ts <CompositionId> out/frames --frames=10,40 --image-format=png`
  renders a few frames to check a transition mid-way.

## Remotion skills

Official Remotion agent skills are installed in `.claude/skills/remotion-*`
(versions match the installed Remotion). Load `remotion-best-practices` before
Remotion work. Restore or refresh them with `npx skills update`.

## Claude Code cloud sandbox

- `.claude/hooks/session-start.sh` runs `npm install` and downloads Chrome
  Headless Shell from Google's CDN, because Remotion's default host
  (remotion.media) is blocked. It exports `REMOTION_BROWSER_EXECUTABLE`, which
  `remotion.config.ts` reads.
- The user can't open Studio from the sandbox. Render to `out/` and send them
  the MP4 or PNG instead.
- No GPU: renders that use WebGL (`engine: "webgl"` transitions,
  `@remotion/effects`, `LightLeakOverlay`) need `--gl=swangle`. Without it they
  fail fast with "Failed to acquire WebGL2 context". swangle is about 4×
  slower, so leave it off for CSS-only renders.
- Measured render speed here: CSS-only about 9 frames/s (10s of video in
  about 30s). With `--gl=swangle` it drops to about 1.4 frames/s, and to about
  0.2 frames/s while WebGL shader transitions are on screen. Check a few frames
  with `--frames` before rendering a full video.
