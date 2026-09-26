import { describe, expect, it } from "vitest";
import { whiteToAlpha } from "../alpha";
import { classifyColor, colorShare } from "../color";
import { alphaBounds, placementBox, unionBox } from "../bounds";
import { changedShare, UNTOUCHED_SHARE } from "../change";
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

  // Thick strokes: pixels deeper than the outline radius follow their stroke.
  const blob = () => {
    const img = createImage(64, 64);
    fillRect(img, 12, 12, 36, 36, BLACK); // a solid black-filled shape, far thicker than 2 x 6 px
    return img;
  };

  it("an untouched thick black shape stays visible, interior included -> 0", () => {
    expect(concealment(blob(), blob())).toBe(0);
  });

  it("a thick black shape under a bigger black fill is hidden, interior included -> 1", () => {
    const covered = blob();
    fillRect(covered, 2, 2, 60, 60, BLACK);
    expect(concealment(blob(), covered)).toBe(1);
  });

  it("a thick black shape half swallowed by a new fill stays mostly visible", () => {
    const partly = blob();
    fillRect(partly, 2, 2, 60, 30, BLACK); // top part merged; the lower sides and bottom still show
    const c = concealment(blob(), partly);
    expect(c).toBeGreaterThan(0.1); // the merged top edge is gone
    expect(c).toBeLessThan(0.4); // the interior is still tied to the visible bottom edge
  });

  it("a thick red shape painted black -> 1", () => {
    const red = createImage(64, 64);
    fillRect(red, 12, 12, 36, 36, RED);
    const black = createImage(64, 64);
    fillRect(black, 12, 12, 36, 36, BLACK);
    expect(concealment(red, black)).toBe(1);
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

describe("changedShare (untouched cover-up guard)", () => {
  it("identical and noise-only stencils read as untouched", () => {
    const img = createImage(64, 64);
    fillRect(img, 8, 28, 48, 8, RED);
    expect(changedShare(img, img)).toBe(0);
    expect(changedShare(addNoise(img, 12, 1), addNoise(img, 12, 2))).toBeLessThan(UNTOUCHED_SHARE);
  });

  it("a small painted patch counts as changed", () => {
    const img = createImage(64, 64);
    const painted = createImage(64, 64);
    fillRect(painted, 0, 0, 4, 4, BLACK); // 16 of 4096 pixels
    expect(changedShare(img, painted)).toBeCloseTo(16 / 4096);
    expect(changedShare(img, painted)).toBeGreaterThan(UNTOUCHED_SHARE);
  });

  it("throws on mismatched sizes", () => {
    expect(() => changedShare(createImage(4, 4), createImage(5, 5))).toThrow();
  });
});

describe("alphaBounds (INKING sweep box)", () => {
  it("finds the box of visible pixels, normalized", () => {
    const img = createImage(10, 20, [0, 0, 0, 0]);
    fillRect(img, 2, 5, 3, 4, RED);
    expect(alphaBounds(img)).toEqual({ x: 0.2, y: 0.25, w: 0.3, h: 0.2 });
  });

  it("ignores near-transparent pixels and returns null when empty", () => {
    const img = createImage(4, 4, [0, 0, 0, 0]);
    setPixel(img, 1, 1, [255, 0, 0], 5);
    expect(alphaBounds(img)).toBeNull();
  });
});

describe("placementBox / unionBox (cover-up sweep)", () => {
  it("boxes a square stencil at scale 1, no rotation", () => {
    const b = placementBox({ cx: 0.5, cy: 0.5, scale: 1, rotate: 0 }, 1);
    expect(b.x).toBeCloseTo(0.3);
    expect(b.w).toBeCloseTo(0.4);
    expect(b.y).toBeCloseTo(0.5 - 0.2 / 1.25);
    expect(b.h).toBeCloseTo(0.4 / 1.25);
  });

  it("grows with rotation and clamps to the image", () => {
    const flat = placementBox({ cx: 0.5, cy: 0.5, scale: 1, rotate: 0 }, 1);
    const turned = placementBox({ cx: 0.5, cy: 0.5, scale: 1, rotate: 45 }, 1);
    expect(turned.w).toBeGreaterThan(flat.w);
    const edge = placementBox({ cx: 0.05, cy: 0.5, scale: 1, rotate: 0 }, 1);
    expect(edge.x).toBe(0);
  });

  it("unions two boxes and passes nulls through", () => {
    const u = unionBox({ x: 0.1, y: 0.1, w: 0.2, h: 0.2 }, { x: 0.25, y: 0.05, w: 0.2, h: 0.1 })!;
    expect(u.x).toBeCloseTo(0.1);
    expect(u.y).toBeCloseTo(0.05);
    expect(u.w).toBeCloseTo(0.35);
    expect(u.h).toBeCloseTo(0.25);
    expect(unionBox(null, { x: 0, y: 0, w: 1, h: 1 })).toEqual({ x: 0, y: 0, w: 1, h: 1 });
    expect(unionBox(null, null)).toBeNull();
  });
});
