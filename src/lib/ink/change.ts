import type { RGBAImage } from "./image";

// Same threshold as concealment: under this RGB distance a pixel counts as unchanged (JPEG noise).
const CHANGE_DISTANCE = 40;

/** Share of pixels that visibly changed between two same-size (normalized) stencils. */
export function changedShare(a: RGBAImage, b: RGBAImage): number {
  if (a.width !== b.width || a.height !== b.height) throw new Error("changedShare: normalize both first");
  const limit = CHANGE_DISTANCE * CHANGE_DISTANCE;
  let changed = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const dr = a.data[i] - b.data[i], dg = a.data[i + 1] - b.data[i + 1], db = a.data[i + 2] - b.data[i + 2];
    if (dr * dr + dg * dg + db * db >= limit) changed++;
  }
  return changed / (a.width * a.height);
}

// A cover-up handed back with less than this much change was not touched (0.1% of the paper).
export const UNTOUCHED_SHARE = 0.001;
