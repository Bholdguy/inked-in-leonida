import { describe, expect, it } from "vitest";
import { whiteToAlpha } from "../alpha";
import { classifyColor, colorShare } from "../color";
import { concealment } from "../concealment";
import { createImage } from "../image";
import { coverage, inkMask } from "../mask";
import { placementHit } from "../placement";
import { addNoise, fillRect, setPixel } from "./helpers";

const RED: [number, number, number] = [220, 30, 40];
const BLACK: [number, number, number] = [20, 20, 20];

describe("whiteToAlpha", () => {
  it("strips pure white to alpha 0", () => {
    const img = createImage(1, 1, [255, 255, 255, 255]);
    expect(whiteToAlpha(img).data[3]).toBe(0);
  });

  it("leaves pure black unchanged", () => {
    const img = createImage(1, 1, [0, 0, 0, 255]);
    expect(Array.from(whiteToAlpha(img).data)).toEqual([0, 0, 0, 255]);
  });

  it("does NOT strip pastel pink (255,170,210)", () => {
    const img = createImage(1, 1, [255, 170, 210, 255]);
    expect(whiteToAlpha(img).data[3]).toBe(255);
  });

  it("does NOT strip a light pastel above the luminance threshold (255,215,235)", () => {
    // L ~ 227; only survives because it is a saturated color.
    const img = createImage(1, 1, [255, 215, 235, 255]);
    expect(whiteToAlpha(img).data[3]).toBe(255);
  });

  it("fades linearly between lo and hi", () => {
    const img = createImage(1, 1, [235, 235, 235, 255]); // L = 235, halfway between 225 and 245
    expect(whiteToAlpha(img).data[3]).toBe(128);
  });
});

describe("classifyColor", () => {
  it.each([
    [[220, 30, 40], "red"],
    [[255, 150, 190], "pink"],
    [[255, 140, 40], "orange"],
    [[20, 20, 20], "black"],
    [[128, 128, 128], "black"],
    [[40, 180, 60], "green"],
  ] as const)("%j -> %s", (rgb, name) => {
    expect(classifyColor(rgb[0], rgb[1], rgb[2])).toBe(name);
  });

  it("covers the rest of the hue wheel", () => {
    expect(classifyColor(230, 210, 30)).toBe("yellow");
    expect(classifyColor(30, 80, 220)).toBe("blue");
    expect(classifyColor(140, 40, 200)).toBe("purple");
    expect(classifyColor(250, 160, 160)).toBe("pink"); // light red
  });
});

describe("coverage", () => {
  it("10x10 with 25 ink pixels -> 0.25", () => {
    const img = createImage(10, 10);
    fillRect(img, 0, 0, 5, 5, BLACK);
    expect(coverage(inkMask(whiteToAlpha(img)))).toBe(0.25);
  });
});

describe("colorShare", () => {
  it("half red, half black -> ~0.5 each", () => {
    const img = createImage(10, 10);
    fillRect(img, 0, 0, 5, 10, RED);
    fillRect(img, 5, 0, 5, 10, BLACK);
    const shares = colorShare(img, inkMask(whiteToAlpha(img)));
    expect(shares.red).toBeCloseTo(0.5);
    expect(shares.black).toBeCloseTo(0.5);
    expect(shares.blue).toBe(0);
  });

  it("returns all zeros with no ink", () => {
    const img = createImage(4, 4);
    const shares = colorShare(img, inkMask(whiteToAlpha(img)));
    expect(Object.values(shares).every((v) => v === 0)).toBe(true);
  });
});

describe("concealment", () => {
  it("identical images -> 0", () => {
    const img = createImage(10, 10);
    fillRect(img, 2, 2, 6, 3, RED);
    expect(concealment(img, img)).toBe(0);
  });

  it("old red ink fully painted black -> 1", () => {
    const oldImg = createImage(10, 10);
    fillRect(oldImg, 2, 2, 6, 3, RED);
    const newImg = createImage(10, 10);
    fillRect(newImg, 0, 0, 10, 10, BLACK);
    expect(concealment(oldImg, newImg)).toBe(1);
  });

  it("half covered -> 0.5", () => {
    const oldImg = createImage(10, 10);
    fillRect(oldImg, 0, 0, 10, 2, RED);
    const newImg = createImage(10, 10);
    fillRect(newImg, 0, 0, 10, 2, RED);
    fillRect(newImg, 0, 0, 5, 2, BLACK);
    expect(concealment(oldImg, newImg)).toBe(0.5);
  });

  it("throws on mismatched sizes", () => {
    expect(() => concealment(createImage(4, 4), createImage(5, 5))).toThrow();
  });

  // Black cover-up over black lettering (the dark cover-up Tino asks for).
  const letters = () => {
    const img = createImage(64, 64);
    for (let k = 0; k < 4; k++) fillRect(img, 8 + k * 13, 24, 6, 16, BLACK); // four 6px-wide strokes
    return img;
  };

  it("untouched black letters stay visible -> 0", () => {
    expect(concealment(letters(), letters())).toBe(0);
  });

  it("black letters under a solid black fill with margin -> 1", () => {
    const covered = letters();
    fillRect(covered, 0, 10, 64, 44, BLACK);
    expect(concealment(letters(), covered)).toBe(1);
  });

  it("black letters on a new red background stay readable -> 0", () => {
    const newImg = createImage(64, 64);
    fillRect(newImg, 0, 10, 64, 44, RED);
    for (let k = 0; k < 4; k++) fillRect(newImg, 8 + k * 13, 24, 6, 16, BLACK);
    expect(concealment(letters(), newImg)).toBe(0);
  });

  it("black fill over only the left half of the letters -> about half hidden", () => {
    const newImg = letters();
    fillRect(newImg, 0, 10, 30, 44, BLACK);
    const c = concealment(letters(), newImg);
    expect(c).toBeGreaterThan(0.3);
    expect(c).toBeLessThan(0.55);
  });

  it("with JPEG noise: black letters under black fill still read as hidden", () => {
    const covered = letters();
    fillRect(covered, 0, 10, 64, 44, BLACK);
    expect(concealment(addNoise(letters(), 12, 7), addNoise(covered, 12, 8))).toBe(1);
  });
});

describe("placementHit", () => {
  const zone = { x: 0.3, y: 0.35, w: 0.4, h: 0.35 };
  it("inside", () => expect(placementHit({ x: 0.5, y: 0.5 }, zone)).toBe(true));
  it("on the edge counts", () => expect(placementHit({ x: 0.3, y: 0.7 }, zone)).toBe(true));
  it("outside", () => expect(placementHit({ x: 0.1, y: 0.5 }, zone)).toBe(false));
  it("below", () => expect(placementHit({ x: 0.5, y: 0.9 }, zone)).toBe(false));
});

// JPEG tolerance: the editor saves opaque stencils as JPEG. Simulate +/-12 per-channel noise
// around a stroke on white paper and check the whole pipeline still reads it correctly.
describe("JPEG tolerance (+/-12 noise around a stroke)", () => {
  const W = 64;
  const clean = createImage(W, W);
  fillRect(clean, 8, 28, 48, 8, RED); // 384 stroke pixels
  const strokeShare = (48 * 8) / (W * W);

  const noisy = addNoise(clean, 12, 1);
  const noisyAgain = addNoise(clean, 12, 2); // same drawing, different JPEG noise

  it("noise is really +/-12 and reaches the extremes", () => {
    let maxDelta = 0;
    for (let i = 0; i < clean.data.length; i++) maxDelta = Math.max(maxDelta, Math.abs(noisy.data[i] - clean.data[i]));
    expect(maxDelta).toBe(12);
  });

  it("whiteToAlpha strips every noisy paper pixel and keeps every stroke pixel", () => {
    const mask = inkMask(whiteToAlpha(noisy));
    for (let y = 0; y < W; y++) {
      for (let x = 0; x < W; x++) {
        const inStroke = x >= 8 && x < 56 && y >= 28 && y < 36;
        expect(mask[y * W + x], `pixel ${x},${y}`).toBe(inStroke ? 1 : 0);
      }
    }
    expect(coverage(mask)).toBeCloseTo(strokeShare, 10);
  });

  it("classifyColor still reads the noisy stroke as red", () => {
    const shares = colorShare(noisy, inkMask(whiteToAlpha(noisy)));
    expect(shares.red).toBe(1);
  });

  it("noisy near-white paper pixels are never classified as a color", () => {
    // Worst cases for HSL: near-white with a small channel spread has saturation ~1.
    // Plus the darkest possible noisy paper pixel, uniform -12 (L = 243).
    for (const [r, g, b] of [[243, 255, 243], [255, 243, 255], [243, 243, 255], [255, 243, 243], [243, 243, 243]]) {
      const img = createImage(1, 1, [r, g, b, 255]);
      expect(inkMask(whiteToAlpha(img))[0], `${r},${g},${b}`).toBe(0);
    }
  });

  it("a noisy gray stroke stays black, not a hue", () => {
    const gray = createImage(W, W);
    fillRect(gray, 8, 28, 48, 8, [90, 90, 90]);
    const shares = colorShare(addNoise(gray, 12, 3), inkMask(whiteToAlpha(addNoise(gray, 12, 3))));
    expect(shares.black).toBe(1);
  });

  it("concealment: same stroke with different noise reads as still visible (~0)", () => {
    expect(concealment(noisy, noisyAgain)).toBeLessThan(0.02);
  });

  it("concealment: stroke painted over in black, with noise, reads as hidden (~1)", () => {
    const covered = createImage(W, W);
    fillRect(covered, 8, 28, 48, 8, RED);
    fillRect(covered, 4, 24, 56, 16, BLACK);
    expect(concealment(noisy, addNoise(covered, 12, 4))).toBe(1);
  });

  it("concealment: half painted over, with noise -> ~0.5", () => {
    const half = createImage(W, W);
    fillRect(half, 8, 28, 48, 8, RED);
    fillRect(half, 8, 28, 24, 8, BLACK);
    const c = concealment(noisy, addNoise(half, 12, 5));
    expect(c).toBeGreaterThan(0.45);
    expect(c).toBeLessThan(0.55);
  });

  it("setPixel helper sanity", () => {
    const img = createImage(2, 2);
    setPixel(img, 1, 1, [1, 2, 3]);
    expect(Array.from(img.data.slice(12, 16))).toEqual([1, 2, 3, 255]);
  });
});
