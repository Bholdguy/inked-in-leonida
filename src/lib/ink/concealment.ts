import { whiteToAlpha } from "./alpha";
import type { RGBAImage } from "./image";
import { inkMask } from "./mask";

// An old ink pixel "keeps its color" when the new pixel is within this RGB distance of it.
// Independent +/-12 JPEG noise on both images stays well under 40 in practice.
export const VISIBLE_DISTANCE = 40;
// How far (in 512px analysis pixels) we look for the outline of an old stroke.
export const OUTLINE_RADIUS = 6;

/**
 * Cover-up only. Both images MUST come from the same normalize() (same size, same letterboxing).
 * Returns 1 - visible / oldInkCount. No old ink -> 1 (nothing left to hide).
 *
 * An old ink pixel is still visible when the new pixel keeps its color AND its outline survives:
 * some nearby pixel that contrasted with it in the old stencil still contrasts in the new one.
 * So black ink painted solidly over black letters hides them (the outline merged into the fill),
 * while untouched letters, even black ones, stay visible.
 */
export function concealment(oldImg: RGBAImage, newImg: RGBAImage): number {
  if (oldImg.width !== newImg.width || oldImg.height !== newImg.height) {
    throw new Error("concealment: images must be the same size (normalize both first)");
  }
  const { width: W, height: H } = oldImg;
  const o = oldImg.data;
  const n = newImg.data;
  const oldMask = inkMask(whiteToAlpha(oldImg));
  const limit = VISIBLE_DISTANCE * VISIBLE_DISTANCE;
  const dist2 = (a: Uint8ClampedArray, i: number, b: Uint8ClampedArray, j: number) => {
    const dr = a[i] - b[j], dg = a[i + 1] - b[j + 1], db = a[i + 2] - b[j + 2];
    return dr * dr + dg * dg + db * db;
  };

  let oldInk = 0;
  let visible = 0;
  for (let p = 0; p < oldMask.length; p++) {
    if (!oldMask[p]) continue;
    oldInk++;
    const i = p * 4;
    if (dist2(o, i, n, i) >= limit) continue; // painted over in a different color

    // Same color as before. Visible unless every old outline pixel nearby was filled in to match.
    const x = p % W, y = (p - x) / W;
    let hadOutline = false;
    let outlineSurvives = false;
    for (let yy = Math.max(0, y - OUTLINE_RADIUS); yy <= Math.min(H - 1, y + OUTLINE_RADIUS) && !outlineSurvives; yy++) {
      for (let xx = Math.max(0, x - OUTLINE_RADIUS); xx <= Math.min(W - 1, x + OUTLINE_RADIUS); xx++) {
        const j = (yy * W + xx) * 4;
        if (dist2(o, i, o, j) < limit) continue; // not part of the old outline
        hadOutline = true;
        if (dist2(o, i, n, j) >= limit) {
          outlineSurvives = true;
          break;
        }
      }
    }
    // Deep inside a thick stroke there is no outline in reach: keep the plain color rule.
    if (outlineSurvives || !hadOutline) visible++;
  }
  return oldInk === 0 ? 1 : 1 - visible / oldInk;
}
