// Turns a stencil + placement into a JobResult in two steps around the judge call:
// prepareJob (browser: composite, analysis, judge images) -> judge -> finishJob (pure scoring merge).
import { bodySrc } from "@/data/bodies";
import { analyzeStencil } from "@/lib/ink/analyze";
import { compositeOutputs, makeTattooLayer } from "@/lib/ink/composite";
import { concealment } from "@/lib/ink/concealment";
import { decodeImage, loadImage, normalize, rgbaToCanvas } from "@/lib/ink/dom";
import type { ColorName, Job, JobResult, Placement } from "@/types";
import { placementHit } from "@/lib/ink/placement";
import { pickReaction } from "@/lib/ink/reaction";
import { moodFor, scoreCoverup, scoreStandard, starsFor, tipFor } from "@/lib/ink/score";
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
  const { png, jpeg512 } = compositeOutputs(body, makeTattooLayer(raw), placement);

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
  };
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
          placementHit: job.targetZone ? placementHit({ x: placement.cx, y: placement.cy }, job.targetZone) : true,
          vision,
        });

  const stars = scored.offensive ? 1 : starsFor(scored.total);
  const mood = scored.offensive ? "angry" : moodFor(stars);
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
    tip: scored.offensive ? 0 : tipFor(job.basePay, stars),
    source: vision.source,
    offensive: scored.offensive,
  };
}
