export interface RGBAImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export function createImage(width: number, height: number, fill: [number, number, number, number] = [255, 255, 255, 255]): RGBAImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) data.set(fill, i);
  return { data, width, height };
}

export function cloneImage(img: RGBAImage): RGBAImage {
  return { data: new Uint8ClampedArray(img.data), width: img.width, height: img.height };
}

// Rec. 709 luminance, 0..255.
export function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// h in degrees [0, 360), s and l in [0, 1].
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const d = max - min;
  const l = (max + min) / 2;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = 60 * (((gn - bn) / d) % 6);
  else if (max === gn) h = 60 * ((bn - rn) / d + 2);
  else h = 60 * ((rn - gn) / d + 4);
  if (h < 0) h += 360;
  return { h, s, l };
}

// max - min channel, 0..255. JPEG noise of +/-12 per channel stays at or under 24.
export function chroma(r: number, g: number, b: number): number {
  return Math.max(r, g, b) - Math.min(r, g, b);
}
