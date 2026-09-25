// PRD 11.2. DOM compositing: ink that sits in the skin, not a sticker on top of it.
import { BODY_HEIGHT, BODY_WIDTH } from "@/data/bodies";
import type { Placement } from "@/types";
import { whiteToAlpha } from "./alpha";
import { makeCanvas, rgbaToCanvas } from "./dom";
import type { RGBAImage } from "./image";

// At scale 1 the stencil is drawn 40% of the body image wide.
export const TATTOO_BASE_WIDTH = 0.4 * BODY_WIDTH;
const INK_ALPHA = 0.92;
const INK_BLUR = "blur(0.4px)";

// Step 2: the raw stencil (full resolution) with its white paper stripped.
export function makeTattooLayer(stencil: RGBAImage): HTMLCanvasElement {
  return rgbaToCanvas(whiteToAlpha(stencil));
}

function context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not available");
  return ctx;
}

/**
 * Steps 1, 3, 4 onto `target` (BODY_WIDTH x BODY_HEIGHT). `scratch` is reused between frames
 * by the live preview; the final output passes nothing and gets a fresh one.
 */
export function renderComposite(
  target: HTMLCanvasElement,
  body: CanvasImageSource,
  tattoo: HTMLCanvasElement,
  p: Placement,
  scratch: HTMLCanvasElement = makeCanvas(BODY_WIDTH, BODY_HEIGHT),
): void {
  const W = BODY_WIDTH, H = BODY_HEIGHT;

  // Step 3: tattoo on its own layer with the placement transform, clipped to the body alpha.
  const ink = context(scratch);
  ink.globalCompositeOperation = "source-over";
  ink.clearRect(0, 0, W, H);
  const w = TATTOO_BASE_WIDTH * p.scale;
  const h = (w * tattoo.height) / tattoo.width;
  ink.save();
  ink.translate(p.cx * W, p.cy * H);
  ink.rotate((p.rotate * Math.PI) / 180);
  ink.filter = INK_BLUR;
  ink.drawImage(tattoo, -w / 2, -h / 2, w, h);
  ink.restore();
  ink.globalCompositeOperation = "destination-in";
  ink.drawImage(body, 0, 0, W, H);
  ink.globalCompositeOperation = "source-over";

  // Steps 1 + 4: body, then the clipped ink multiplied into it.
  const out = context(target);
  out.save();
  out.clearRect(0, 0, W, H);
  out.drawImage(body, 0, 0, W, H);
  out.globalCompositeOperation = "multiply";
  out.globalAlpha = INK_ALPHA;
  out.drawImage(scratch, 0, 0);
  out.restore();
}

export interface CompositeOutputs {
  png: string; // 1000x1250 PNG data URL
  jpeg512: string; // longest side 512, JPEG q0.85, for the judge
}

// Step 5: the final composite plus the small JPEG for the vision judge.
export function compositeOutputs(body: CanvasImageSource, tattoo: HTMLCanvasElement, p: Placement): CompositeOutputs {
  const full = makeCanvas(BODY_WIDTH, BODY_HEIGHT);
  renderComposite(full, body, tattoo, p);

  const scale = 512 / Math.max(BODY_WIDTH, BODY_HEIGHT);
  const small = makeCanvas(Math.round(BODY_WIDTH * scale), Math.round(BODY_HEIGHT * scale));
  const ctx = context(small);
  ctx.fillStyle = "#fff"; // JPEG has no alpha: put the body on white, not black
  ctx.fillRect(0, 0, small.width, small.height);
  ctx.drawImage(full, 0, 0, small.width, small.height);

  return { png: full.toDataURL("image/png"), jpeg512: small.toDataURL("image/jpeg", 0.85) };
}
