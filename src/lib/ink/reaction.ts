import type { Mood } from "@/types";

// Mood scale, lowest to highest. "Within one step" = adjacent on this scale.
export const MOOD_SCALE: readonly Mood[] = ["angry", "meh", "happy", "thrilled"];

export function moodDistance(a: Mood, b: Mood): number {
  return Math.abs(MOOD_SCALE.indexOf(a) - MOOD_SCALE.indexOf(b));
}

export interface ReactionInput {
  scoreMood: Mood; // the mood shown to the player, from the score (9.2)
  canned: Record<Mood, string>; // the job's lines (15.2)
  model?: { reaction: string; mood: Mood } | null; // vision judge output, if any
}

/**
 * PRD 11.3: the model's line is used only when its mood is within one step of the score mood;
 * otherwise (or with no usable model line) the canned line for the score mood.
 */
export function pickReaction({ scoreMood, canned, model }: ReactionInput): string {
  const line = model?.reaction.trim();
  if (model && line && moodDistance(model.mood, scoreMood) <= 1) return line;
  return canned[scoreMood];
}
