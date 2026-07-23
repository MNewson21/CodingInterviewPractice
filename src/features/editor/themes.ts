import type { Monaco } from '@monaco-editor/react';

/** A selectable base mode shown as a labelled button in the theme switcher. */
export interface ThemeMode {
  /** Monaco theme id, also used as the `data-app-theme` key for the page ramp. */
  id: string;
  label: string;
}

export const DEFAULT_EDITOR_THEME = 'vs-dark';

/** The Monaco theme id used when the user is on a custom colour. */
export const CUSTOM_THEME_ID = 'custom';

// The two built-in base modes. Day = light (`vs`), Night = dark (`vs-dark`); both are
// Monaco built-ins and have matching `:root[data-app-theme=...]` ramps in index.css.
export const MODES: ThemeMode[] = [
  { id: 'vs', label: 'Day' },
  { id: 'vs-dark', label: 'Night' },
];

/** The zinc scale steps we tint, in ramp order (50 = text end, 950 = background end). */
const ZINC_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

// Perceptual spacing of each step between the text end (0) and the background end (1).
// Mirrors the hand-tuned distribution of the existing preset ramps.
const STEP_T = [0, 0.06, 0.12, 0.22, 0.34, 0.5, 0.62, 0.72, 0.82, 0.92, 1];

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Expand shorthand and lowercase a hex string to a canonical `#rrggbb`. */
export function normalizeHex(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const to = (v: number) => v.toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex);
  const rf = r / 255, gf = g / 255, bf = b / 255;
  const max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rf: h = (gf - bf) / d + (gf < bf ? 6 : 0); break;
      case gf: h = (bf - rf) / d + 2; break;
      default: h = (rf - gf) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s, l };
}

export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = clamp01(s);
  l = clamp01(l);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** True when a colour is dark enough to want light foreground text on it. */
export function isDarkHex(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  // Perceived (sRGB-weighted) luminance; ~0.5 is a reasonable light/dark split.
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5;
}

/**
 * Build the 11-step `--color-zinc-*` ramp for a custom base colour. The picked colour
 * anchors the background end (950); the text end (50) is forced to a high-contrast
 * light/dark lightness so foreground text stays legible whatever colour is chosen. The
 * hue is held constant and saturation eases toward the background so text isn't garish.
 */
export function buildZincRamp(hex: string): Record<string, string> {
  const { h, s, l } = hexToHsl(hex);
  const textL = isDarkHex(hex) ? 0.96 : 0.12;
  const textS = s * 0.35;
  const ramp: Record<string, string> = {};
  ZINC_STEPS.forEach((step, i) => {
    const t = STEP_T[i];
    if (step === 950) {
      // Keep the background end exactly the colour the user picked.
      ramp[`--color-zinc-${step}`] = normalizeHex(hex);
      return;
    }
    const stepL = textL + (l - textL) * t;
    const stepS = textS + (s - textS) * t;
    ramp[`--color-zinc-${step}`] = hslToHex(h, stepS, stepL);
  });
  return ramp;
}

/** CSS custom-property names the ramp sets, so callers can clear them cleanly. */
export const ZINC_VAR_NAMES = ZINC_STEPS.map((step) => `--color-zinc-${step}`);

/**
 * (Re)define the Monaco `custom` theme from a base colour. Safe to call repeatedly;
 * pair with `monaco.editor.setTheme('custom')` to repaint an open editor after a change.
 */
export function defineCustomEditorTheme(monaco: Monaco, hex: string): void {
  const dark = isDarkHex(hex);
  monaco.editor.defineTheme(CUSTOM_THEME_ID, {
    base: dark ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': normalizeHex(hex),
      'editor.foreground': dark ? '#f5f5f5' : '#111111',
    },
  });
}
