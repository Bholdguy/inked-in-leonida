import type { ColorName } from "@/types";
import { chroma, rgbToHsl, type RGBAImage } from "./image";

export const COLOR_NAMES: ColorName[] = ["black", "red", "pink", "orange", "yellow", "green", "blue", "purple"];

// JPEG tolerance: +/-12 per-channel noise on a gray stroke has chroma <= 24. Treat that as neutral ink.
const NOISE_CHROMA = 24;

export function classifyColor(r: number, g: number, b: number): ColorName {
  const { h, s, l } = rgbToHsl(r, g, b);
  if (l < 0.18 || (s < 0.18 && l < 0.6)) return "black";
  if (s < 0.18) return "black"; // grays count as black ink
  if (chroma(r, g, b) <= NOISE_CHROMA) return "black";
  if (h >= 345 || h < 15) return l > 0.68 ? "pink" : "red";
  if (h < 40) return "orange";
  if (h < 65) return "yellow";
  if (h < 170) return "green";
  if (h < 260) return "blue";
  if (h < 300) return "purple";
  return "pink";
}

// Fraction of ink pixels per color. All colors present, 0 when absent.
export function colorShare(img: RGBAImage, mask: Uint8Array): Record<ColorName, number> {
  const counts = Object.fromEntries(COLOR_NAMES.map((c) => [c, 0])) as Record<ColorName, number>;
  let total = 0;
  for (let p = 0; p < mask.length; p++) {
    if (!mask[p]) continue;
    const i = p * 4;
    counts[classifyColor(img.data[i], img.data[i + 1], img.data[i + 2])]++;
    total++;
  }
  if (total > 0) for (const c of COLOR_NAMES) counts[c] /= total;
  return counts;
}
