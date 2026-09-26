import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { POST } from "@/app/api/judge/route";
import { judgeLimiter } from "../rateLimit";
import { clearJudgeCache, TIMEOUT_MS } from "../gemini";

// Distinctive fake image bytes so we can prove they never reach a log line.
const IMAGE = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from("SECRET-PIXELS-".repeat(20))]).toString("base64");
const STENCIL = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe1]), Buffer.from("STENCIL-PIXELS-".repeat(20))]).toString("base64");
const KEY = "test-key-not-real";

const verdict = {
  motifMatch: true,
  letteringFound: "CRYSTAL",
  letteringMatch: true,
  oldTextReadable: null,
  offensive: false,
  reaction: "Bro. She's gonna cry.",
  mood: "thrilled",
};

const geminiOk = (text: string) =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text, thoughtSignature: "sig" }] }, finishReason: "STOP" }] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

const call = (body: unknown, ip = "203.0.113.7") =>
  POST(
    new Request("http://localhost/api/judge", {
      method: "POST",
      headers: { "x-forwarded-for": `${ip}, 10.0.0.1` },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

let fetchMock: MockInstance;
let logs: string[];

beforeEach(() => {
  clearJudgeCache();
  judgeLimiter.reset();
  vi.stubEnv("GEMINI_API_KEY", KEY);
  vi.stubEnv("GEMINI_MODEL", "");
  vi.stubEnv("JUDGE_FORCE", "");
  fetchMock = vi.fn(async () => geminiOk(JSON.stringify(verdict)));
  vi.stubGlobal("fetch", fetchMock);
  logs = [];
  for (const level of ["log", "info", "warn", "error", "debug"] as const) {
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    });
  }
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  // Nothing sensitive may ever be logged.
  for (const line of logs) {
    expect(line).not.toContain(IMAGE.slice(0, 40));
    expect(line).not.toContain(STENCIL.slice(0, 40));
    expect(line).not.toContain(KEY);
  }
});

async function expectFallback(res: Response) {
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body).toEqual({ source: "fallback" });
}

describe("POST /api/judge", () => {
  it("returns the vision verdict on success", async () => {
    const res = await call({ jobId: "tino-1", compositeJpegB64: IMAGE, stencilJpegB64: STENCIL });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ source: "vision", ...verdict });
    expect(JSON.stringify(body)).not.toContain(KEY);
  });

  it("sends the key in a header (not the URL), JSON mode, schema, minimal thinking and both labelled images", async () => {
    await call({ jobId: "tino-1", compositeJpegB64: IMAGE, stencilJpegB64: STENCIL, order: { lettering: "HACKED" } });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent");
    expect(url).not.toContain(KEY);
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe(KEY);
    const sent = JSON.parse(String(init.body));
    expect(sent.generationConfig.responseMimeType).toBe("application/json");
    expect(sent.generationConfig.responseSchema.required).toHaveLength(7);
    expect(sent.generationConfig.thinkingConfig).toEqual({ thinkingLevel: "minimal" });
    const parts = sent.contents[0].parts;
    expect(parts[0]).toEqual({ text: "Image 1: STENCIL" });
    expect(parts[1].inline_data).toEqual({ mime_type: "image/jpeg", data: STENCIL });
    expect(parts[2]).toEqual({ text: "Image 2: TATTOO ON SKIN" });
    expect(parts[3].inline_data).toEqual({ mime_type: "image/jpeg", data: IMAGE });
    const prompt = sent.systemInstruction.parts[0].text as string;
    expect(prompt).toContain('lettering "CRYSTAL"'); // from server data, not the client's "HACKED"
    expect(prompt).not.toContain("HACKED");
  });

  it("uses GEMINI_MODEL when set", async () => {
    vi.stubEnv("GEMINI_MODEL", "gemini-3.8-flash");
    await call({ jobId: "tino-1", compositeJpegB64: IMAGE });
    expect(String(fetchMock.mock.calls[0][0])).toContain("/models/gemini-3.8-flash:generateContent");
  });

  it("caches identical requests per job", async () => {
    await call({ jobId: "tino-1", compositeJpegB64: IMAGE });
    await call({ jobId: "tino-1", compositeJpegB64: IMAGE });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await call({ jobId: "kaylee-1", compositeJpegB64: IMAGE });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("no key -> fallback without calling Gemini", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    await expectFallback(await call({ jobId: "tino-1", compositeJpegB64: IMAGE }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([400, 403, 429, 500, 503])("HTTP %i -> fallback", async (status) => {
    fetchMock.mockResolvedValueOnce(new Response('{"error":{"message":"nope"}}', { status }));
    await expectFallback(await call({ jobId: "tino-1", compositeJpegB64: IMAGE }));
  });

  it.each([
    ["model text is not JSON", geminiOk("not json at all")],
    ["missing field", geminiOk(JSON.stringify({ ...verdict, mood: undefined }))],
    ["wrong type", geminiOk(JSON.stringify({ ...verdict, motifMatch: "true" }))],
    ["bad mood", geminiOk(JSON.stringify({ ...verdict, mood: "furious" }))],
    ["no candidates", new Response("{}", { status: 200 })],
    ["body is not JSON", new Response("<html>", { status: 200 })],
  ])("%s -> fallback", async (_, response) => {
    fetchMock.mockResolvedValueOnce(response);
    await expectFallback(await call({ jobId: "tino-1", compositeJpegB64: IMAGE }));
  });

  it("network error -> fallback", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expectFallback(await call({ jobId: "tino-1", compositeJpegB64: IMAGE }));
  });

  it(`times out after ${TIMEOUT_MS} ms -> fallback`, async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementationOnce(
      (_url: string, init: RequestInit) =>
        new Promise((_, reject) => init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))),
    );
    const pending = call({ jobId: "tino-1", compositeJpegB64: IMAGE });
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS - 1);
    let settled = false;
    void pending.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expectFallback(await pending);
    expect(logs.some((l) => l.includes("timeout"))).toBe(true);
  });

  it.each([
    ["invalid JSON body", "{oops"],
    ["unknown job", { jobId: "ghost", compositeJpegB64: IMAGE }],
    ["non-JPEG image", { jobId: "tino-1", compositeJpegB64: "iVBORw0KGgo=" }],
  ])("bad request (%s) -> 200 fallback, Gemini not called", async (_, body) => {
    await expectFallback(await call(body));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("JUDGE_FORCE=offensive works outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("JUDGE_FORCE", "offensive");
    const body = await (await call({ jobId: "tino-1", compositeJpegB64: IMAGE })).json();
    expect(body.source).toBe("vision");
    expect(body.offensive).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("JUDGE_FORCE is ignored in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("JUDGE_FORCE", "offensive");
    const body = await (await call({ jobId: "tino-1", compositeJpegB64: IMAGE })).json();
    expect(body).toEqual({ source: "vision", ...verdict });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rate limit: 20 requests per IP per 10 minutes, the 21st gets 200 fallback", async () => {
    for (let i = 0; i < 20; i++) {
      const body = await (await call({ jobId: "tino-1", compositeJpegB64: IMAGE })).json();
      expect(body.source).toBe("vision"); // cached after the first, still allowed
    }
    await expectFallback(await call({ jobId: "tino-1", compositeJpegB64: IMAGE }));
    expect(logs.some((l) => l.includes("rate-limited"))).toBe(true);
    // A different client is unaffected.
    const other = await (await call({ jobId: "tino-1", compositeJpegB64: IMAGE }, "198.51.100.2")).json();
    expect(other.source).toBe("vision");
  });

  it("JUDGE_FORCE=fallback outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("JUDGE_FORCE", "fallback");
    await expectFallback(await call({ jobId: "tino-1", compositeJpegB64: IMAGE }));
  });
});
