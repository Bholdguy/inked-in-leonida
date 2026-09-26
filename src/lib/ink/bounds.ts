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

/**
 * Normalized box around a placed stencil (composite.ts draws it TATTOO_BASE_WIDTH * scale wide,
 * rotated about its center). `baseWidth` and `bodyAspect` (height / width) are in body units.
 */
export function placementBox(
  p: { cx: number; cy: number; scale: number; rotate: number },
  stencilAspect: number, // stencil height / width
  baseWidth = 0.4,
  bodyAspect = 1.25,
): Rect {
  const w = baseWidth * p.scale; // in body widths
  const h = w * stencilAspect;
  const a = (p.rotate * Math.PI) / 180;
  const halfW = (Math.abs(Math.cos(a)) * w + Math.abs(Math.sin(a)) * h) / 2;
  const halfH = (Math.abs(Math.sin(a)) * w + Math.abs(Math.cos(a)) * h) / 2 / bodyAspect;
  const x0 = Math.max(0, p.cx - halfW), x1 = Math.min(1, p.cx + halfW);
  const y0 = Math.max(0, p.cy - halfH), y1 = Math.min(1, p.cy + halfH);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function unionBox(a: Rect | null, b: Rect | null): Rect | null {
  if (!a) return b;
  if (!b) return a;
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}
