import type { JobId, Mood } from "@/types";

// What the client sends. The server derives order, mode and oldLettering from jobId itself.
export interface JudgeRequest {
  jobId: JobId;
  compositeJpegB64: string; // 512px JPEG, no data: prefix
  stencilJpegB64?: string; // 512px JPEG of the stencil on white, no data: prefix
}

export interface VisionJudgement {
  source: "vision";
  motifMatch: boolean;
  letteringFound: string | null;
  letteringMatch: boolean;
  oldTextReadable: boolean | null;
  offensive: boolean;
  reaction: string;
  mood: Mood;
}

// Always returned with HTTP 200.
export type JudgeResponse = VisionJudgement | { source: "fallback" };

export const FALLBACK: JudgeResponse = Object.freeze({ source: "fallback" as const });
