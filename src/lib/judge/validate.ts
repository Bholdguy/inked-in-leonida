import { JOBS } from "@/data/jobs";
import type { JobId, Mood } from "@/types";
import type { JudgeRequest, VisionJudgement } from "./types";

// A 512px JPEG is ~20-80 KB; anything near this cap is not what the client sends.
export const MAX_IMAGE_B64 = 700_000;
const MOODS: readonly Mood[] = ["thrilled", "happy", "meh", "angry"];
const SCORED_JOBS = new Set<JobId>(JOBS.filter((j) => j.mode !== "free").map((j) => j.id));

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function isJpegB64(v: unknown): v is string {
  if (typeof v !== "string" || v.length < 8 || v.length > MAX_IMAGE_B64) return false;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(v)) return false;
  return v.startsWith("/9j/"); // base64 of the JPEG SOI marker FF D8 FF
}

/** Only jobId and the images are read. order, mode and oldLettering from the client are ignored. */
export function parseJudgeRequest(body: unknown): JudgeRequest | null {
  if (!isRecord(body)) return null;
  const { jobId, compositeJpegB64, stencilJpegB64 } = body;
  if (typeof jobId !== "string" || !SCORED_JOBS.has(jobId as JobId)) return null;
  if (!isJpegB64(compositeJpegB64)) return null;
  if (stencilJpegB64 !== undefined && stencilJpegB64 !== null && !isJpegB64(stencilJpegB64)) return null;
  return {
    jobId: jobId as JobId,
    compositeJpegB64,
    ...(typeof stencilJpegB64 === "string" ? { stencilJpegB64 } : {}),
  };
}

// Plain text only: letters, numbers, punctuation, spaces and a few symbols. Max 140 chars.
export function sanitizeReaction(raw: string): string {
  const plain = raw
    .replace(/<[^>]*>/g, " ") // HTML-ish tags
    .replace(/\s+/g, " ") // tabs, newlines -> single spaces (before they count as "other")
    .replace(/[^\p{L}\p{N}\p{P}\p{Zs}$+=]/gu, "") // emoji, symbols, control chars
    .replace(/[*_`#<>~|\\[\]{}]/g, "") // markdown
    .replace(/ {2,}/g, " ")
    .trim();
  return plain.length <= 140 ? plain : plain.slice(0, 139).trimEnd() + "…";
}

/** Hand-validates the model's JSON text. Any missing or mistyped field -> null (fallback). */
export function parseVerdict(text: string): VisionJudgement | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  return validateVerdict(data);
}

/** Same checks on an already-parsed object (the client re-checks what /api/judge returns). */
export function validateVerdict(data: unknown): VisionJudgement | null {
  if (!isRecord(data)) return null;
  const { motifMatch, letteringFound, letteringMatch, oldTextReadable, offensive, reaction, mood } = data;
  if (typeof motifMatch !== "boolean") return null;
  if (letteringFound !== null && typeof letteringFound !== "string") return null;
  if (typeof letteringMatch !== "boolean") return null;
  if (oldTextReadable !== null && typeof oldTextReadable !== "boolean") return null;
  if (typeof offensive !== "boolean") return null;
  if (typeof reaction !== "string") return null;
  if (typeof mood !== "string" || !MOODS.includes(mood as Mood)) return null;
  const found = letteringFound === null ? null : sanitizeReaction(letteringFound).slice(0, 60) || null;
  return {
    source: "vision",
    motifMatch,
    letteringFound: found,
    letteringMatch,
    oldTextReadable,
    offensive,
    reaction: sanitizeReaction(reaction),
    mood: mood as Mood,
  };
}
