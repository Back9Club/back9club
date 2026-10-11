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
| `LaunchTeaser`                | 19.5s cinematic launch teaser with score, sound design and voiceover.        |
| `Fifteen`                     | 15s motion study: type, form, 3D, data and finale chapters, 160 BPM score. `npm run fifteen` |
| `Story`                       | Template: text scenes joined by transitions. Edit everything in Studio's props panel. |
| `Showcase / TransitionsCSS`   | Plays every CSS transition, ending with a light-leak cut.                   |
| `Showcase / TransitionsWebGL` | Plays every WebGL shader transition.                                         |

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
