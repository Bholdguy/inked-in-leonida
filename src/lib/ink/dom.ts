// Browser-only helpers. Everything scoring-related stays pure in the sibling modules.
import type { RGBAImage } from "./image";

export const NORMALIZED_SIZE = 512;

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image")); // never echo the source (data URLs are player drawings)
    img.src = src;
  });
}

export function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function ctx2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D is not available");
  return ctx;
}

export function readPixels(canvas: HTMLCanvasElement): RGBAImage {
  const { data, width, height } = ctx2d(canvas).getImageData(0, 0, canvas.width, canvas.height);
  return { data, width, height };
}

export function rgbaToCanvas(img: RGBAImage): HTMLCanvasElement {
  const canvas = makeCanvas(img.width, img.height);
  ctx2d(canvas).putImageData(new ImageData(new Uint8ClampedArray(img.data), img.width, img.height), 0, 0);
  return canvas;
}

/**
 * Analysis copy of a stencil: 512x512, letterboxed on white. The old (tino-1) and new (tino-2)
 * stencils MUST both go through this function before concealment().
 */
export async function normalize(stencilDataUrl: string): Promise<RGBAImage> {
  const img = await loadImage(stencilDataUrl);
  const canvas = makeCanvas(NORMALIZED_SIZE, NORMALIZED_SIZE);
  const ctx = ctx2d(canvas);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, NORMALIZED_SIZE, NORMALIZED_SIZE);
  const fit = Math.min(NORMALIZED_SIZE / img.naturalWidth, NORMALIZED_SIZE / img.naturalHeight);
  const w = img.naturalWidth * fit;
  const h = img.naturalHeight * fit;
  ctx.drawImage(img, (NORMALIZED_SIZE - w) / 2, (NORMALIZED_SIZE - h) / 2, w, h);
  return readPixels(canvas);
}

// Full-resolution pixels (the composite uses the raw 1024 stencil).
export async function decodeImage(dataUrl: string): Promise<RGBAImage> {
  const img = await loadImage(dataUrl);
  const canvas = makeCanvas(img.naturalWidth, img.naturalHeight);
  ctx2d(canvas).drawImage(img, 0, 0);
  return readPixels(canvas);
}

export async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
