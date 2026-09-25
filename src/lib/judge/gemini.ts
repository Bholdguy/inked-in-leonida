// Server-only: calls Gemini generateContent (PRD 11.3). Never logs image data or the key.
import { createHash } from "node:crypto";
import { getJob } from "@/data/jobs";
import { buildSystemPrompt, RESPONSE_SCHEMA } from "./prompt";
import { FALLBACK, type JudgeRequest, type JudgeResponse, type VisionJudgement } from "./types";
import { parseVerdict } from "./validate";

export const DEFAULT_MODEL = "gemini-3.5-flash-lite"; // verified in task 2.0 (PRD Section 16)
export const DEFAULT_THINKING_LEVEL = "minimal";
export const TIMEOUT_MS = 8000;
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const CACHE_LIMIT = 100;

// Best-effort, per server instance. Only successful vision verdicts are cached.
const cache = new Map<string, VisionJudgement>();
export const clearJudgeCache = () => cache.clear();

function cacheKey(req: JudgeRequest): string {
  return createHash("sha256")
    .update(req.jobId)
    .update("\0")
    .update(req.compositeJpegB64)
    .update("\0")
    .update(req.stencilJpegB64 ?? "")
    .digest("hex");
}

export interface JudgeEnv {
  apiKey: string | undefined;
  model?: string;
  thinkingLevel?: string;
  fetchImpl?: typeof fetch;
}

// Reason codes only; nothing about the request body.
function fail(reason: string): JudgeResponse {
  console.warn(`[judge] fallback: ${reason}`);
  return FALLBACK;
}

export async function judgeWithGemini(req: JudgeRequest, env: JudgeEnv): Promise<JudgeResponse> {
  if (!env.apiKey) return fail("no-key");

  const key = cacheKey(req);
  const cached = cache.get(key);
  if (cached) return cached;

  const job = getJob(req.jobId);
  const oldLettering = job.mode === "coverup" ? getJob("tino-1").lettering : null;
  const hasStencil = typeof req.stencilJpegB64 === "string";
  const parts = hasStencil
    ? [
        { text: "Image 1: STENCIL" },
        { inline_data: { mime_type: "image/jpeg", data: req.stencilJpegB64 } },
        { text: "Image 2: TATTOO ON SKIN" },
        { inline_data: { mime_type: "image/jpeg", data: req.compositeJpegB64 } },
      ]
    : [{ inline_data: { mime_type: "image/jpeg", data: req.compositeJpegB64 } }];

  const body = {
    systemInstruction: { parts: [{ text: buildSystemPrompt(job, { hasStencil, oldLettering }) }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      thinkingConfig: { thinkingLevel: env.thinkingLevel || DEFAULT_THINKING_LEVEL },
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await (env.fetchImpl ?? fetch)(`${ENDPOINT}/${env.model || DEFAULT_MODEL}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": env.apiKey },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) return fail(`http-${res.status}`);
    const json: unknown = await res.json();
    const text = extractText(json);
    if (!text) return fail("empty");
    const verdict = parseVerdict(text);
    if (!verdict) return fail("invalid-json");
    if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!);
    cache.set(key, verdict);
    return verdict;
  } catch (err) {
    return fail(controller.signal.aborted ? "timeout" : err instanceof Error ? err.name : "error");
  } finally {
    clearTimeout(timer);
  }
}

// candidates[0].content.parts[].text; parts may also carry thoughtSignature, which is skipped.
function extractText(json: unknown): string | null {
  const parts = (json as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] })?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  const text = parts.map((p) => (typeof p?.text === "string" ? p.text : "")).join("");
  return text || null;
}
