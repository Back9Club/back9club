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

- `src/Root.tsx`: composition registry (`Advert`, `AdvertBallShot`,
  `LaunchTeaser`, `Fifteen`, `Story`, `Showcase/TransitionsCSS`,
  `Showcase/TransitionsWebGL`)
- `src/fifteen/`: FIFTEEN, a 15s motion study (chapters in a `TransitionSeries`
  centred on downbeat cuts, countdown HUD). Cues in `src/fifteen/timeline.json`,
  soundtrack from `scripts/audio/build_fifteen.py` (reuses the instruments in
  `build_audio.py`). `npm run fifteen` renders `out/fifteen.mp4`.
- `src/motion/`: easing, timing, the `TRANSITIONS` catalog, and custom
  presentations (`zoomThrough`, `blurDissolve`, `whipPan`, `cardStack`,
  `cardExpand`)
- `src/components/`: `Background` (gradient + anti-banding grain),
  `SafeArea`, `RevealText` (kinetic type), `LightLeakOverlay`
- `src/compositions/`: `story/` (editable template driven by a zod schema)
  and `showcase/` (plays every transition)

## Advert (`Advert`)

18s / 540 frames, no voiceover. Cues (seconds) live in `src/advert/timeline.json`,
read by the scenes (`src/advert/timeline.ts`) and by
`scripts/advert/build_audio.py`. Scenes use the teaser's `Scene`/`useTime`.

- Scenes: `src/advert/scenes/`. The opening ball is a three.js shot
  (`AdvertBallShot`, `src/advert/BallShot.tsx`) pre-rendered to
  `public/advert/ball-shot.mp4` and played with `OffthreadVideo`, so the main
  render is CSS-only. Re-render it with `npm run advert -- --ball` (swangle,
  about 7 min).
- Type shadows go on a wrapper *outside* `MaskLine` (`TYPE_SHADOW` in
  `src/advert/style.ts`); a `textShadow` inside the mask is clipped into a box.
- `Logo` takes `whiteFrom="left"`, `greenOpacity` and `greenGlow` for the neon
  reveal; defaults keep the teaser unchanged.
- `npm run advert [-- --audio]` renders `out/back9club-advert.mp4` (exactly
  18.0s, about 2 min here).

## Launch teaser (`LaunchTeaser`)

19.5s / 585 frames. `src/teaser/timeline.json` is the single source of truth
for every cue (seconds), read by both the scenes (`src/teaser/timeline.ts`,
`useTime()` gives absolute seconds inside any `<Scene>`) and the audio build.
Move a cue there, then rebuild audio and re-render; never hard-code times.

- Scenes: `src/teaser/scenes/` (Hook, BrandReveal, Opening, HowToPlay,
  BigStatement, FinalTeaser). Components: `src/teaser/components/`.
- Logo: `src/brand/logo-paths.ts`, traced from
  `public/brand/back9club-logo-original.png` by `scripts/trace-logo.py`
  (needs `apt install potrace`). Use the `Logo` component; don't redraw it.
- Audio: `scripts/audio/build_audio.py` synthesises the score and sound design
  (numpy/scipy), ducks music under the voice, masters to -14 LUFS / -1.2 dBTP
  and writes `public/audio/{stems,sfx}/`, `mix.wav`, `mix-no-vo.wav`.
- Voiceover: `public/audio/vo/<id>.wav` (ids in `timeline.json`). The current
  files are a GUIDE voice from `scripts/audio/guide_vo.py` (MBROLA en1, needs
  `apt install espeak-ng mbrola mbrola-en1 sox`): natural TTS hosts
  (huggingface.co, ElevenLabs, OpenAI) are blocked in the cloud sandbox. To use
  a real voice, replace those WAVs (same names) and run `npm run teaser -- --audio`.
- `npm run teaser` renders and exports `out/back9club-launch-teaser.mp4` and
  `out/back9club-launch-teaser-no-vo.mp4` (exactly 19.5s; ~2 min here).

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
