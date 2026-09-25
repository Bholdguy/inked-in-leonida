import { whiteToAlpha } from "./alpha";
import type { RGBAImage } from "./image";
import { inkMask } from "./mask";

// An old ink pixel is "still visible" when the new pixel is within this RGB distance of it.
// Independent +/-12 JPEG noise on both images stays well under 40 in practice.
export const VISIBLE_DISTANCE = 40;

/**
 * Cover-up only. Both images MUST come from the same normalize() (same size, same letterboxing).
 * Returns 1 - visible / oldInkCount. No old ink -> 1 (nothing left to hide).
 */
export function concealment(oldImg: RGBAImage, newImg: RGBAImage): number {
  if (oldImg.width !== newImg.width || oldImg.height !== newImg.height) {
    throw new Error("concealment: images must be the same size (normalize both first)");
  }
  const oldMask = inkMask(whiteToAlpha(oldImg));
  const limit = VISIBLE_DISTANCE * VISIBLE_DISTANCE;
  let oldInk = 0;
  let visible = 0;
  for (let p = 0; p < oldMask.length; p++) {
    if (!oldMask[p]) continue;
    oldInk++;
    const i = p * 4;
    const dr = oldImg.data[i] - newImg.data[i];
    const dg = oldImg.data[i + 1] - newImg.data[i + 1];
    const db = oldImg.data[i + 2] - newImg.data[i + 2];
    if (dr * dr + dg * dg + db * db < limit) visible++;
  }
  return oldInk === 0 ? 1 : 1 - visible / oldInk;
}
