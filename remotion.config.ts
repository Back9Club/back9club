// See all configuration options: https://remotion.dev/docs/config
// Each option also is available as a CLI flag: https://remotion.dev/docs/cli

// Note: When using the Node.JS APIs, the config file doesn't apply. Instead, pass options directly to the APIs

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setOverwriteOutput(true);

// Output quality, tuned for social uploads (Reels / TikTok / Shorts re-encode
// everything, so hand them a clean, high-bitrate master).
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setCodec("h264");
Config.setCrf(16);
Config.setPixelFormat("yuv420p");
Config.setColorSpace("bt709");

// WebGL is needed by the shader transitions (@remotion/transitions/*-blur,
// cross-zoom, film-burn, ...) and by @remotion/effects (light leaks, etc.).
// "angle" uses the GPU. Machines without one (CI, the Claude Code cloud
// sandbox) set REMOTION_GL=swangle to render WebGL in software.
Config.setChromiumOpenGlRenderer(
  (process.env.REMOTION_GL as "angle" | "swangle" | undefined) ?? "angle",
);

// Optional: point Remotion at a specific Chrome Headless Shell binary.
// Used by the Claude Code cloud sandbox (see .claude/hooks/session-start.sh),
// where Remotion's default browser download host is not reachable.
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
