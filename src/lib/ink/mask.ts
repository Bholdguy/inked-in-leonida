import type { RGBAImage } from "./image";

// 1 where alpha > 32. Call on the output of whiteToAlpha.
export function inkMask(img: RGBAImage): Uint8Array {
  const mask = new Uint8Array(img.width * img.height);
  for (let p = 0; p < mask.length; p++) mask[p] = img.data[p * 4 + 3] > 32 ? 1 : 0;
  return mask;
}

// Ink pixels / total pixels. Measured on the 512 normalized stencil mask.
export function coverage(mask: Uint8Array): number {
  if (mask.length === 0) return 0;
  let ink = 0;
  for (let p = 0; p < mask.length; p++) ink += mask[p];
  return ink / mask.length;
}
