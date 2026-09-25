// Browser side of the judge. Never throws: anything unexpected is the fallback.
import { FALLBACK, type JudgeResponse } from "@/lib/judge/types";
import { validateVerdict } from "@/lib/judge/validate";
import type { JobId } from "@/types";

export const CLIENT_CAP_MS = 9000; // PRD 8.2: INKING never waits longer than 9 s

export async function requestJudgement(
  jobId: JobId,
  compositeJpegB64: string,
  stencilJpegB64: string,
  fetchImpl: typeof fetch = fetch,
): Promise<JudgeResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_CAP_MS);
  try {
    const res = await fetchImpl("/api/judge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId, compositeJpegB64, stencilJpegB64 }),
      signal: controller.signal,
    });
    if (!res.ok) return FALLBACK;
    const body: unknown = await res.json();
    if ((body as { source?: unknown })?.source !== "vision") return FALLBACK;
    return validateVerdict(body) ?? FALLBACK;
  } catch {
    return FALLBACK;
  } finally {
    clearTimeout(timer);
  }
}
