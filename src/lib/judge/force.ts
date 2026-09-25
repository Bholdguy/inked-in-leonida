import { FALLBACK, type JudgeResponse } from "./types";

export type ForceMode = "offensive" | "fallback" | "slow";
const MODES: readonly ForceMode[] = ["offensive", "fallback", "slow"];

/** Dev-only test switch (JUDGE_FORCE). Always null when NODE_ENV is "production". */
export function forceMode(env: { NODE_ENV?: string; JUDGE_FORCE?: string }): ForceMode | null {
  if (env.NODE_ENV === "production") return null;
  const v = env.JUDGE_FORCE?.trim();
  return v && (MODES as readonly string[]).includes(v) ? (v as ForceMode) : null;
}

export const SLOW_MS = 12_000; // longer than the client's 9 s cap

export async function forcedResponse(mode: ForceMode, sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))): Promise<JudgeResponse> {
  if (mode === "offensive") {
    return {
      source: "vision",
      motifMatch: true,
      letteringFound: null,
      letteringMatch: false,
      oldTextReadable: null,
      offensive: true,
      reaction: "",
      mood: "angry",
    };
  }
  if (mode === "slow") await sleep(SLOW_MS);
  return FALLBACK;
}
