import type { ColorName, Mood, Rect } from "@/types";
import { placementHit } from "./placement";

export type VisionVerdict =
  | { source: "fallback" }
  | {
      source: "vision";
      motifMatch: boolean;
      letteringFound: string | null;
      letteringMatch: boolean;
      oldTextReadable: boolean | null;
      offensive: boolean;
    };

export type Breakdown = Record<string, { got: number; max: number }>;
export interface ScoreResult { total: number; breakdown: Breakdown; offensive: boolean }

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const FALLBACK_MOTIF = 15;
const FALLBACK_LETTERING = 15;

export interface StandardInput {
  requiredColors: ColorName[];
  forbiddenColors: ColorName[];
  shares: Record<ColorName, number>;
  coverage: number;
  range: { min: number; max: number };
  placementHit: boolean;
  vision: VisionVerdict;
}

export function paletteStandard(required: ColorName[], forbidden: ColorName[], shares: Record<ColorName, number>): number {
  const slice = required.length ? 25 / required.length : 0;
  let pts = required.reduce((sum, c) => sum + (shares[c] >= 0.05 ? slice : 0), 0);
  for (const c of forbidden) if (shares[c] > 0.1) pts -= 10;
  return Math.max(0, pts);
}

// Full inside [min, max]; linear falloff to 0 at min / 2 and at 1.5 * max.
export function coveragePoints(c: number, { min, max }: { min: number; max: number }): number {
  if (c >= min && c <= max) return 15;
  if (c < min) return 15 * clamp01((c - min / 2) / (min / 2));
  return 15 * clamp01((1.5 * max - c) / (0.5 * max));
}

export function scoreStandard(i: StandardInput): ScoreResult {
  const v = i.vision;
  const motif = v.source === "vision" ? (v.motifMatch ? 25 : 0) : FALLBACK_MOTIF;
  const lettering =
    v.source === "vision" ? (v.letteringMatch ? 25 : v.letteringFound?.trim() ? 10 : 0) : FALLBACK_LETTERING;
  const breakdown: Breakdown = {
    palette: { got: paletteStandard(i.requiredColors, i.forbiddenColors, i.shares), max: 25 },
    coverage: { got: coveragePoints(i.coverage, i.range), max: 15 },
    placement: { got: i.placementHit ? 10 : 0, max: 10 },
    motif: { got: motif, max: 25 },
    lettering: { got: lettering, max: 25 },
  };
  return finish(breakdown, v);
}

export interface CoverupInput {
  concealment: number;
  blackShare: number;
  vision: VisionVerdict;
}

export function scoreCoverup(i: CoverupInput): ScoreResult {
  const v = i.vision;
  const oldName =
    v.source === "vision" && v.oldTextReadable !== null ? (v.oldTextReadable ? 0 : 20) : i.concealment >= 0.85 ? 20 : 0;
  const breakdown: Breakdown = {
    concealment: { got: 40 * clamp01((i.concealment - 0.5) / 0.4), max: 40 },
    oldName: { got: oldName, max: 20 },
    palette: { got: i.blackShare >= 0.25 ? 15 : 0, max: 15 },
    motif: { got: v.source === "vision" ? (v.motifMatch ? 25 : 0) : FALLBACK_MOTIF, max: 25 },
  };
  return finish(breakdown, v);
}

function finish(breakdown: Breakdown, v: VisionVerdict): ScoreResult {
  // Parts are shown to the player: keep them free of float noise (19.999... -> 20).
  for (const part of Object.values(breakdown)) part.got = Math.round(part.got * 100) / 100;
  const offensive = v.source === "vision" && v.offensive;
  const sum = Object.values(breakdown).reduce((s, p) => s + p.got, 0);
  return { total: offensive ? 0 : Math.round(sum), breakdown, offensive };
}

// A job with no target zone (the finale) cannot miss.
export function zoneHit(center: { x: number; y: number }, zone: Rect | null): boolean {
  return zone ? placementHit(center, zone) : true;
}

export interface Verdict {
  stars: 1 | 2 | 3 | 4 | 5;
  mood: Mood;
  tip: number;
}

// Stars, mood and tip from the score; an offensive tattoo overrides to 1 star, angry, no tip.
export function verdictFor({ score, offensive, basePay }: { score: number; offensive: boolean; basePay: number }): Verdict {
  if (offensive) return { stars: 1, mood: "angry", tip: 0 };
  const stars = starsFor(score);
  return { stars, mood: moodFor(stars), tip: tipFor(basePay, stars) };
}

export function starsFor(score: number): 1 | 2 | 3 | 4 | 5 {
  if (score >= 90) return 5;
  if (score >= 75) return 4;
  if (score >= 55) return 3;
  if (score >= 35) return 2;
  return 1;
}

export function moodFor(stars: 1 | 2 | 3 | 4 | 5): Mood {
  return stars === 5 ? "thrilled" : stars === 4 ? "happy" : stars === 3 ? "meh" : "angry";
}

// basePay * stars / 5, rounded to $5.
export function tipFor(basePay: number, stars: number): number {
  return Math.round((basePay * stars) / 5 / 5) * 5;
}
