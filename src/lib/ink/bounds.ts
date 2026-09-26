import type { Rect } from "@/types";
import type { RGBAImage } from "./image";

/** Normalized (0..1) bounding box of pixels with alpha above `threshold`; null when there are none. */
export function alphaBounds(img: RGBAImage, threshold = 8): Rect | null {
  const { width: W, height: H, data } = img;
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] <= threshold) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;
  return { x: minX / W, y: minY / H, w: (maxX - minX + 1) / W, h: (maxY - minY + 1) / H };
}
