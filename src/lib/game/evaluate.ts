// Turns a stencil + placement into a JobResult in two steps around the judge call:
// prepareJob (browser: composite, analysis, judge images) -> judge -> finishJob (pure scoring merge).
import { bodySrc } from "@/data/bodies";
import { analyzeStencil } from "@/lib/ink/analyze";
import { compositeOutputs, freshInk, makeTattooLayer } from "@/lib/ink/composite";
import { concealment } from "@/lib/ink/concealment";
import { decodeImage, loadImage, normalize, rgbaToCanvas } from "@/lib/ink/dom";
import type { ColorName, Job, JobResult, Placement, Rect } from "@/types";
import { pickReaction } from "@/lib/ink/reaction";
import { scoreCoverup, scoreStandard, verdictFor, zoneHit } from "@/lib/ink/score";
import { FALLBACK, type JudgeResponse } from "@/lib/judge/types";

export interface PreparedJob {
  job: Job;
  stencil: string; // raw editor output
  placement: Placement;
  composite: string; // 1000x1250 PNG data URL
  compositeJpegB64: string; // 512px JPEG for the judge, no data: prefix
  stencilJpegB64: string; // 512x512 normalized stencil JPEG for the judge, no data: prefix
  coverage: number;
  shares: Record<ColorName, number>;
  concealment: number | null; // cover-up only
  halo: string; // INKING: fresh-ink halo layer (PNG data URL, body size)
  inkBox: Rect | null; // INKING: where the needle sweeps
  stencilAspect: number; // stencil height / width (the cover-up keeps tino-1's size)
}

export interface PrepareInput {
  job: Job;
  stencil: string;
  placement: Placement;
  previousStencil?: string; // cover-up: the raw tino-1 stencil
}

const b64 = (dataUrl: string) => dataUrl.slice(dataUrl.indexOf(",") + 1);

export async function prepareJob({ job, stencil, placement, previousStencil }: PrepareInput): Promise<PreparedJob> {
  const [body, raw, analysis] = await Promise.all([
    loadImage(bodySrc(job.body.zone, job.body.tone)),
    decodeImage(stencil),
    analyzeStencil(stencil),
  ]);
  const tattoo = makeTattooLayer(raw);
  const { png, jpeg512 } = compositeOutputs(body, tattoo, placement);
  const { halo, box } = freshInk(body, tattoo, placement);

  let hidden: number | null = null;
  if (job.mode === "coverup") {
    if (!previousStencil) throw new Error("Cover-up needs the tino-1 stencil");
    // Old and new stencils go through the exact same normalize().
    hidden = concealment(await normalize(previousStencil), analysis.normalized);
  }

  return {
    job,
    stencil,
    placement,
    composite: png,
    compositeJpegB64: b64(jpeg512),
    stencilJpegB64: b64(rgbaToCanvas(analysis.normalized).toDataURL("image/jpeg", 0.85)),
    coverage: analysis.coverage,
    shares: analysis.shares,
    concealment: hidden,
    halo,
    inkBox: box,
    stencilAspect: raw.height / raw.width,
  };
}

/**
 * finishJob with a safety net for INKING: if merging the judge verdict throws, score the same
 * drawing on the canned fallback; null only if even that fails (the screen then offers a way back).
 */
export function safeFinish(p: PreparedJob, vision: JudgeResponse): JobResult | null {
  try {
    return finishJob(p, vision);
  } catch (err) {
    console.error("[evaluate] verdict merge failed, using the canned fallback", err instanceof Error ? err.name : err);
  }
  try {
    return finishJob(p, FALLBACK);
  } catch (err) {
    console.error("[evaluate] fallback scoring failed", err instanceof Error ? err.name : err);
    return null;
  }
}

/** Pure: merges the judge verdict (or the fallback) into the 9.2 score and picks the line (11.3). */
export function finishJob(p: PreparedJob, vision: JudgeResponse = FALLBACK): JobResult {
  const { job, placement } = p;
  const scored =
    job.mode === "coverup"
      ? scoreCoverup({ concealment: p.concealment ?? 0, blackShare: p.shares.black, vision })
      : scoreStandard({
          requiredColors: job.requiredColors,
          forbiddenColors: job.forbiddenColors,
          shares: p.shares,
          coverage: p.coverage,
          range: job.coverage ?? { min: 0, max: 1 },
          placementHit: zoneHit({ x: placement.cx, y: placement.cy }, job.targetZone),
          vision,
        });

  const { stars, mood, tip } = verdictFor({ score: scored.total, offensive: scored.offensive, basePay: job.basePay });
  return {
    stencil: p.stencil,
    composite: p.composite,
    placement,
    score: scored.total,
    breakdown: scored.breakdown,
    stars,
    mood,
    reaction: scored.offensive
      ? job.refusal
      : pickReaction({ scoreMood: mood, canned: job.lines, model: vision.source === "vision" ? vision : null }),
    tip,
    source: vision.source,
    offensive: scored.offensive,
  };
}

/** Pure: the finale is unscored. No judge call, no stars in the shop rating, no tip. */
export function finishFree(p: PreparedJob): JobResult {
  return {
    stencil: p.stencil,
    composite: p.composite,
    placement: p.placement,
    score: 0,
    breakdown: {},
    stars: 5,
    mood: "thrilled",
    reaction: "",
    tip: 0,
    source: "fallback",
    offensive: false,
  };
}
