// POST /api/judge (PRD 11.3). Always HTTP 200; any failure is { source: "fallback" }.
import { forcedResponse, forceMode } from "@/lib/judge/force";
import { judgeWithGemini } from "@/lib/judge/gemini";
import { FALLBACK, type JudgeResponse } from "@/lib/judge/types";
import { parseJudgeRequest } from "@/lib/judge/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10; // above the 8 s Gemini timeout

const reply = (body: JudgeResponse) =>
  Response.json(body, { status: 200, headers: { "cache-control": "no-store" } });

export async function POST(request: Request): Promise<Response> {
  try {
    const req = parseJudgeRequest(await request.json().catch(() => null));
    if (!req) {
      console.warn("[judge] fallback: bad-request");
      return reply(FALLBACK);
    }
    const forced = forceMode(process.env);
    if (forced) return reply(await forcedResponse(forced));
    return reply(
      await judgeWithGemini(req, {
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL,
        thinkingLevel: process.env.GEMINI_THINKING_LEVEL,
      }),
    );
  } catch (err) {
    console.warn(`[judge] fallback: ${err instanceof Error ? err.name : "error"}`);
    return reply(FALLBACK);
  }
}
