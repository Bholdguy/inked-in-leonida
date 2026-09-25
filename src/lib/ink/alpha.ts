import { chroma, luminance, rgbToHsl, type RGBAImage } from "./image";

// Below this chroma a pixel is treated as neutral. Near-white JPEG noise has a huge HSL
// saturation (tiny spread / tiny denominator), so saturation alone would keep it as ink.
export const NEUTRAL_CHROMA = 32;

export function isSaturatedColor(r: number, g: number, b: number): boolean {
  return rgbToHsl(r, g, b).s > 0.35 && chroma(r, g, b) > NEUTRAL_CHROMA;
}

/**
 * Strips the white stencil paper to transparent. L >= hi -> alpha 0, L <= lo -> unchanged,
 * linear in between. Saturated light colors (pastel pink) are never stripped.
 */
export function whiteToAlpha(img: RGBAImage, lo = 225, hi = 245): RGBAImage {
  const out = new Uint8ClampedArray(img.data);
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i], g = out[i + 1], b = out[i + 2];
    const L = luminance(r, g, b);
    if (L <= lo || isSaturatedColor(r, g, b)) continue;
    out[i + 3] = L >= hi ? 0 : Math.round((out[i + 3] * (hi - L)) / (hi - lo));
  }
  return { data: out, width: img.width, height: img.height };
}
