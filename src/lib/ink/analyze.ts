// Browser-side glue: decode a stencil once, then run the pure functions on it.
import type { ColorName } from "@/types";
import { whiteToAlpha } from "./alpha";
import { changedShare, UNTOUCHED_SHARE } from "./change";
import { colorShare } from "./color";
import { normalize } from "./dom";
import type { RGBAImage } from "./image";
import { coverage, inkMask } from "./mask";

export interface StencilAnalysis {
  normalized: RGBAImage; // 512x512 analysis copy
  coverage: number;
  shares: Record<ColorName, number>;
}

export async function analyzeStencil(stencilDataUrl: string): Promise<StencilAnalysis> {
  const normalized = await normalize(stencilDataUrl);
  const mask = inkMask(whiteToAlpha(normalized));
  return { normalized, coverage: coverage(mask), shares: colorShare(normalized, mask) };
}

// Used as the empty-stencil guard on the editor's Save path, where hasChanges() is not reliable.
export async function stencilHasInk(stencilDataUrl: string): Promise<boolean> {
  return (await analyzeStencil(stencilDataUrl)).coverage > 0;
}

// Cover-up guard: the editor's own Save hands back the old stencil even if nothing was painted.
export async function stencilUntouched(beforeDataUrl: string, afterDataUrl: string): Promise<boolean> {
  const [before, after] = await Promise.all([normalize(beforeDataUrl), normalize(afterDataUrl)]);
  return changedShare(before, after) < UNTOUCHED_SHARE;
}
