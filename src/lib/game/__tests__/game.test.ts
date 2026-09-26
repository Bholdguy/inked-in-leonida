import { afterEach, describe, expect, it, vi } from "vitest";
import { getJob } from "@/data/jobs";
import { COLOR_NAMES } from "@/lib/ink/color";
import type { VisionJudgement } from "@/lib/judge/types";
import type { ColorName } from "@/types";
import { finishJob, safeFinish, type PreparedJob } from "../evaluate";
import { CLIENT_CAP_MS, requestJudgement } from "../judgeClient";

const shares = (s: Partial<Record<ColorName, number>>) =>
  ({ ...Object.fromEntries(COLOR_NAMES.map((c) => [c, 0])), ...s }) as Record<ColorName, number>;

const tino = getJob("tino-1");
const prepared = (over: Partial<PreparedJob> = {}): PreparedJob => ({
  job: tino,
  stencil: "data:image/jpeg;base64,STENCIL",
  placement: { cx: 0.5, cy: 0.5, scale: 1, rotate: 0 }, // inside the forearm zone
  composite: "data:image/png;base64,COMPOSITE",
  compositeJpegB64: "/9j/AA",
  stencilJpegB64: "/9j/BB",
  coverage: 0.2,
  shares: shares({ red: 0.6, black: 0.4 }),
  concealment: null,
  ...over,
});

const vision = (v: Partial<VisionJudgement>): VisionJudgement => ({
  source: "vision",
  motifMatch: true,
  letteringFound: "CRYSTAL",
  letteringMatch: true,
  oldTextReadable: null,
  offensive: false,
  reaction: "Model says hi.",
  mood: "thrilled",
  ...v,
});

describe("finishJob (vision merged into 9.2)", () => {
  it("Tino can reach 100 and 5 stars with vision", () => {
    const r = finishJob(prepared(), vision({}));
    expect(r.score).toBe(100);
    expect(r.stars).toBe(5);
    expect(r.mood).toBe("thrilled");
    expect(r.tip).toBe(180);
    expect(r.source).toBe("vision");
    expect(r.offensive).toBe(false);
    expect(r.breakdown.motif.got).toBe(25);
    expect(r.breakdown.lettering.got).toBe(25);
  });

  it("same drawing on the fallback caps at 80 / 4 stars", () => {
    const r = finishJob(prepared(), { source: "fallback" });
    expect(r.score).toBe(80);
    expect(r.stars).toBe(4);
    expect(r.source).toBe("fallback");
    expect(r.reaction).toBe(tino.lines.happy);
  });

  it("uses the model line when its mood is within one step of the score mood", () => {
    expect(finishJob(prepared(), vision({ mood: "happy" })).reaction).toBe("Model says hi."); // score mood thrilled
  });

  it("uses the canned line when the model mood is two or more steps away", () => {
    const r = finishJob(prepared(), vision({ mood: "meh" })); // score thrilled, model meh
    expect(r.mood).toBe("thrilled");
    expect(r.reaction).toBe(tino.lines.thrilled);
  });

  it("wrong lettering found -> 10 lettering points", () => {
    const r = finishJob(prepared(), vision({ letteringMatch: false, letteringFound: "CRISPY" }));
    expect(r.breakdown.lettering.got).toBe(10);
    expect(r.score).toBe(85);
  });

  it("offensive -> 0, angry, refusal, no tip (never the model line)", () => {
    const r = finishJob(prepared(), vision({ offensive: true, mood: "angry", reaction: "model line" }));
    expect(r.score).toBe(0);
    expect(r.mood).toBe("angry");
    expect(r.stars).toBe(1);
    expect(r.reaction).toBe(tino.refusal);
    expect(r.tip).toBe(0);
    expect(r.offensive).toBe(true);
  });

  it("cover-up uses concealment from preparation", () => {
    const r = finishJob(prepared({ job: getJob("tino-2"), concealment: 0.95, shares: shares({ black: 0.8 }) }), vision({ oldTextReadable: false }));
    expect(r.breakdown).toMatchObject({ concealment: { got: 40 }, oldName: { got: 20 }, palette: { got: 15 }, motif: { got: 25 } });
    expect(r.score).toBe(100);
  });
});

describe("safeFinish (INKING safety net)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("passes a good verdict through", () => {
    expect(safeFinish(prepared(), vision({}))?.score).toBe(100);
  });

  it("falls back to the canned result when merging the verdict throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const broken = { ...vision({}), reaction: undefined } as unknown as VisionJudgement; // .trim() on undefined
    const r = safeFinish(prepared(), broken);
    expect(r?.source).toBe("fallback");
    expect(r?.score).toBe(80);
    expect(r?.reaction).toBe(tino.lines.happy);
  });

  it("returns null when even the fallback cannot score", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const bad = prepared({ shares: undefined as unknown as PreparedJob["shares"] });
    expect(safeFinish(bad, vision({}))).toBeNull();
  });
});

describe("requestJudgement (client, 9 s cap)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const ok = (body: unknown) => async () => new Response(JSON.stringify(body), { status: 200 });

  it("returns a validated vision verdict", async () => {
    const body = { source: "vision", motifMatch: true, letteringFound: "CRYSTAL", letteringMatch: true, oldTextReadable: null, offensive: false, reaction: "Nice.", mood: "happy" };
    const fetchImpl = vi.fn(ok(body));
    expect(await requestJudgement("tino-1", "/9j/A", "/9j/B", fetchImpl as unknown as typeof fetch)).toEqual(body);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/judge");
    expect(JSON.parse(String(init.body))).toEqual({ jobId: "tino-1", compositeJpegB64: "/9j/A", stencilJpegB64: "/9j/B" });
  });

  it.each([
    ["fallback from server", ok({ source: "fallback" })],
    ["malformed vision", ok({ source: "vision", motifMatch: "yes" })],
    ["not JSON", async () => new Response("<html>", { status: 200 })],
    ["HTTP 500", async () => new Response("{}", { status: 500 })],
    ["network error", async () => { throw new TypeError("offline"); }],
  ])("%s -> fallback", async (_, impl) => {
    expect(await requestJudgement("tino-1", "/9j/A", "/9j/B", impl as unknown as typeof fetch)).toEqual({ source: "fallback" });
  });

  it(`gives up after ${CLIENT_CAP_MS} ms`, async () => {
    vi.useFakeTimers();
    const hang = (_: string, init: RequestInit) =>
      new Promise<Response>((_, reject) => init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))));
    const pending = requestJudgement("tino-1", "/9j/A", "/9j/B", hang as unknown as typeof fetch);
    await vi.advanceTimersByTimeAsync(CLIENT_CAP_MS);
    expect(await pending).toEqual({ source: "fallback" });
  });
});
