import { createImage, type RGBAImage } from "../image";

export type RGB = [number, number, number];

export function setPixel(img: RGBAImage, x: number, y: number, [r, g, b]: RGB, a = 255) {
  img.data.set([r, g, b, a], (y * img.width + x) * 4);
}

export function fillRect(img: RGBAImage, x0: number, y0: number, w: number, h: number, color: RGB) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) setPixel(img, x, y, color);
}

// Deterministic PRNG (mulberry32) so noise tests are stable.
export function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Simulated JPEG noise: every channel of every pixel shifted by an integer in [-amount, +amount].
export function addNoise(img: RGBAImage, amount: number, seed: number): RGBAImage {
  const rand = rng(seed);
  const out = createImage(img.width, img.height);
  for (let i = 0; i < img.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      out.data[i + c] = img.data[i + c] + Math.round((rand() * 2 - 1) * amount);
    }
    out.data[i + 3] = img.data[i + 3];
  }
  return out;
}
