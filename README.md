# Back 9 Club Motion

Vertical (9:16, 1080×1920 @ 30fps) motion graphics built with
[Remotion](https://www.remotion.dev) 4.0.534.

## Getting started

```bash
npm install
npm run dev          # opens Remotion Studio
```

Render a video:

```bash
npx remotion render src/index.ts Story out/story.mp4
```

Renders are H.264, CRF 16, bt709, tuned as a high-quality master for
Instagram / TikTok / YouTube Shorts.

## Compositions

| ID                            | What it is                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `Advert`                      | 18s premium advert: 3D golf ball strike, statement, 2027, access, neon logo reveal. `npm run advert` |
| `LaunchTeaser`                | 19.5s cinematic launch teaser with score, sound design and voiceover.        |
| `Fifteen`                     | 15s motion study: type, form, 3D, data and finale chapters, 160 BPM score. `npm run fifteen` |
| `Story`                       | Template: text scenes joined by transitions. Edit everything in Studio's props panel. |
| `Showcase / TransitionsCSS`   | Plays every CSS transition, ending with a light-leak cut.                   |
| `Showcase / TransitionsWebGL` | Plays every WebGL shader transition.                                         |

## Advert

```bash
npm run advert                     # render out/back9club-advert.mp4 (exactly 18.0s)
npm run advert -- --audio          # rebuild the soundtrack first
npm run advert -- --ball --audio   # also re-render the 3D golf ball shot (slow)
```

- Every cue (seconds): `src/advert/timeline.json`, read by the scenes and the
  audio build. Move a cue, then run with `--audio`.
- Scenes: `src/advert/scenes/` (BallOpen, Statement, OpeningYear, Access,
  LogoFinale), assembled in `src/advert/Advert.tsx`.
- The opening golf ball is real 3D (three.js via `@remotion/three`):
  `src/advert/components/GolfBall3D.tsx`, camera and launch in
  `src/advert/BallShot.tsx`. Its dimple maps come from
  `scripts/advert/golf_ball_maps.py`. The shot is pre-rendered to
  `public/advert/ball-shot.mp4` so the main render needs no WebGL.
- Audio: `scripts/advert/build_audio.py` synthesises the score and sound
  design and masters to -14 LUFS. Output: `public/audio/advert/`
  (`music.wav`, `sfx.wav`, `mix.wav`). No voiceover.

## Launch teaser

```bash
npm run teaser             # render out/back9club-launch-teaser(-no-vo).mp4
npm run teaser -- --audio  # rebuild the soundtrack first, then render
```

- Timing for every scene, word, hit and voice line: `src/teaser/timeline.json`
- Scenes and components: `src/teaser/`
- Audio assets: `public/audio/` (`vo/` voice lines, `sfx/` one-shots,
  `stems/` music / sfx / vo, `mix.wav` master, `mix-no-vo.wav`)
- Music and sound design are synthesised from scratch by
  `scripts/audio/build_audio.py` (Python 3 with numpy and scipy).

**Replacing the voiceover.** The voice lines in `public/audio/vo/` are a
synthetic guide voice for timing. Record or generate the real read, export each
line as a WAV with the same file name, and run `npm run teaser -- --audio`.
Each line starts at the time listed in `timeline.json`; the music ducks under
it automatically.

## Transitions

Every preset lives in `src/motion/transitions.ts` as
`TRANSITIONS.<name>`, with a presentation and tuned easing:

```tsx
<TransitionSeries.Transition
  presentation={TRANSITIONS.whipPan.presentation}
  timing={TRANSITIONS.whipPan.timing}
/>
```

**CSS (preview in any browser):** fade, blurDissolve\*, zoomThrough\*,
whipPan\*, whipPanUp\*, slideUp, slideLeft, cardStack\*, cardExpand\*, wipe,
iris, clockWipe, flip, pushCut. (\* = custom, in `src/motion/presentations/`)

**WebGL shaders:** blurSlide, linearBlur, zoomBlur, crossZoom, dreamyZoom,
zoomInOut, dissolve, filmBurn, crosswarp, ripple, swap, bookFlip. These render
normally from the CLI. To preview them in Studio, use Chrome 149+ and enable
`chrome://flags/#canvas-draw-element`.

The building blocks are also available on their own: `EASE` and `SPRING`
(`src/motion/easing.ts`) and `TIMING` (`src/motion/timing.ts`).

## Customising

- Brand colors, fonts, type sizes: `src/theme.ts`
- Video size and social-app safe area: `src/config.ts`
- Upgrade Remotion: `npx remotion upgrade`

## AI assistance

Remotion's official agent skills are in `.claude/skills/`, and `CLAUDE.md`
holds the project rules for Claude Code.
