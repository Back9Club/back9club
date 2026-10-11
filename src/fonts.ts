import interTight from "@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2";
import inter from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2";
import { loadFont } from "@remotion/fonts";
import { FONTS } from "./theme";

// Fonts are bundled from npm instead of fetched from Google Fonts at render
// time, so renders are deterministic and also work offline / in sandboxes.
// Both are variable fonts: any weight from 100 to 900 is available.
loadFont({ family: FONTS.display, url: interTight, weight: "100 900" });
loadFont({ family: FONTS.body, url: inter, weight: "100 900" });
