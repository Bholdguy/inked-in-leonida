// Browser-side: turns a stencil + placement into a JobResult. All math lives in src/lib/ink.
import { bodySrc } from "@/data/bodies";
import { analyzeStencil } from "@/lib/ink/analyze";
import { compositeOutputs, makeTattooLayer } from "@/lib/ink/composite";
import { concealment } from "@/lib/ink/concealment";
import { decodeImage, loadImage, normalize } from "@/lib/ink/dom";
import { placementHit } from "@/lib/ink/placement";
import { moodFor, scoreCoverup, scoreStandard, starsFor, tipFor, type VisionVerdict } from "@/lib/ink/score";
import type { Job, JobResult, Placement } from "@/types";

export interface EvaluateInput {
  job: Job;
  stencil: string; // raw editor output
  placement: Placement;
  previousStencil?: string; // cover-up: the raw tino-1 stencil
  vision?: VisionVerdict; // Phase 1: always the fallback
}

export interface Evaluation {
  result: JobResult;
  jpeg512: string; // for the judge (Phase 2)
}

export async function evaluateJob({ job, stencil, placement, previousStencil, vision = { source: "fallback" } }: EvaluateInput): Promise<Evaluation> {
  const [body, raw, analysis] = await Promise.all([
    loadImage(bodySrc(job.body.zone, job.body.tone)),
    decodeImage(stencil),
    analyzeStencil(stencil),
  ]);
  const { png, jpeg512 } = compositeOutputs(body, makeTattooLayer(raw), placement);

  let scored;
  if (job.mode === "coverup") {
    if (!previousStencil) throw new Error("Cover-up needs the tino-1 stencil");
    // Old and new stencils go through the exact same normalize().
    const oldImg = await normalize(previousStencil);
    scored = scoreCoverup({ concealment: concealment(oldImg, analysis.normalized), blackShare: analysis.shares.black, vision });
  } else {
    scored = scoreStandard({
      requiredColors: job.requiredColors,
      forbiddenColors: job.forbiddenColors,
      shares: analysis.shares,
      coverage: analysis.coverage,
      range: job.coverage ?? { min: 0, max: 1 },
      placementHit: job.targetZone ? placementHit({ x: placement.cx, y: placement.cy }, job.targetZone) : true,
      vision,
    });
  }

  const stars = scored.offensive ? 1 : starsFor(scored.total);
  const mood = scored.offensive ? "angry" : moodFor(stars);
  return {
    jpeg512,
    result: {
      stencil,
      composite: png,
      placement,
      score: scored.total,
      breakdown: scored.breakdown,
      stars,
      mood,
      reaction: scored.offensive ? job.refusal : job.lines[mood],
      tip: scored.offensive ? 0 : tipFor(job.basePay, stars),
      source: vision.source,
    },
  };
}
