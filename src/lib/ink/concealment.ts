import { whiteToAlpha } from "./alpha";
import type { RGBAImage } from "./image";
import { inkMask } from "./mask";

// An old ink pixel "keeps its color" when the new pixel is within this RGB distance of it.
// Independent +/-12 JPEG noise on both images stays well under 40 in practice.
export const VISIBLE_DISTANCE = 40;
// How far (in 512px analysis pixels) we look for the outline of an old stroke.
export const OUTLINE_RADIUS = 6;

// Pixel states; 0 (the Uint8Array default) is hidden.
const VISIBLE = 1;
const INTERIOR = 2; // same color, no old outline in reach: decided by the stroke it belongs to

/**
 * Cover-up only. Both images MUST come from the same normalize() (same size, same letterboxing).
 * Returns 1 - visible / oldInkCount. No old ink -> 1 (nothing left to hide).
 *
 * An old ink pixel is still visible when the new pixel keeps its color AND the old shape still
 * stands out: near the edge of a stroke, some pixel that contrasted with it in the old stencil
 * still contrasts in the new one; deep inside a thick stroke, it is connected (through
 * same-colored old ink that kept its color) to such a visible edge. So black ink painted solidly
 * over black letters or a black-filled shape hides them, while untouched ink stays visible.
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

  const state = new Uint8Array(W * H); // 0 = hidden
  const queue: number[] = [];
  let oldInk = 0;
  for (let p = 0; p < oldMask.length; p++) {
    if (!oldMask[p]) continue;
    oldInk++;
    const i = p * 4;
    if (dist2(o, i, n, i) >= limit) continue; // painted over in a different color

    // Same color as before. Look for the old outline nearby and whether it survived.
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
    if (outlineSurvives) {
      state[p] = VISIBLE;
      queue.push(p);
    } else if (!hadOutline) {
      state[p] = INTERIOR;
    }
  }

  // Interior pixels are visible only if their stroke still has a visible edge.
  for (let q = 0; q < queue.length; q++) {
    const p = queue[q];
    const x = p % W;
    const neighbors = [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W];
    for (const nb of neighbors) {
      if (nb < 0 || nb >= W * H || state[nb] !== INTERIOR) continue;
      if (dist2(o, p * 4, o, nb * 4) >= limit) continue; // a different old stroke
      state[nb] = VISIBLE;
      queue.push(nb);
    }
  }

  let visible = 0;
  for (let p = 0; p < state.length; p++) if (state[p] === VISIBLE) visible++;
  return oldInk === 0 ? 1 : 1 - visible / oldInk;
}
