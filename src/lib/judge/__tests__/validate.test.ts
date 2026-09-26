import { describe, expect, it } from "vitest";
import { getJob } from "@/data/jobs";
import { forceMode } from "../force";
import { buildSystemPrompt } from "../prompt";
import { MAX_IMAGE_B64, parseJudgeRequest, parseVerdict, sanitizeReaction } from "../validate";

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]).toString("base64");
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString("base64");

describe("parseJudgeRequest", () => {
  it("accepts a valid request and keeps only jobId + images", () => {
    const req = parseJudgeRequest({
      jobId: "tino-1",
      mode: "coverup",
      order: { motif: "x", lettering: "HACKED", requiredColors: [] },
      oldLettering: "IGNORE ME",
      compositeJpegB64: JPEG,
      stencilJpegB64: JPEG,
    });
    expect(req).toEqual({ jobId: "tino-1", compositeJpegB64: JPEG, stencilJpegB64: JPEG });
  });

  it("stencil is optional", () => {
    expect(parseJudgeRequest({ jobId: "kaylee-1", compositeJpegB64: JPEG })).toEqual({ jobId: "kaylee-1", compositeJpegB64: JPEG });
  });

  it.each([
    ["not an object", "hello"],
    ["array", [1, 2]],
    ["null", null],
    ["unknown job", { jobId: "nope", compositeJpegB64: JPEG }],
    ["free-mode job", { jobId: "self", compositeJpegB64: JPEG }],
    ["missing composite", { jobId: "tino-1" }],
    ["PNG instead of JPEG", { jobId: "tino-1", compositeJpegB64: PNG }],
    ["data: prefix", { jobId: "tino-1", compositeJpegB64: `data:image/jpeg;base64,${JPEG}` }],
    ["not base64", { jobId: "tino-1", compositeJpegB64: "/9j/!!!!" }],
    ["too large", { jobId: "tino-1", compositeJpegB64: "/9j/" + "A".repeat(MAX_IMAGE_B64) }],
    ["bad stencil", { jobId: "tino-1", compositeJpegB64: JPEG, stencilJpegB64: 42 }],
  ])("rejects %s", (_, body) => {
    expect(parseJudgeRequest(body)).toBeNull();
  });
});

const good = {
  motifMatch: true,
  letteringFound: "CRYSTAL",
  letteringMatch: true,
  oldTextReadable: null,
  offensive: false,
  reaction: "Bro. She's gonna cry.",
  mood: "thrilled",
};

describe("parseVerdict", () => {
  it("accepts a well-formed verdict", () => {
    expect(parseVerdict(JSON.stringify(good))).toEqual({ source: "vision", ...good });
  });

  it("accepts nulls where allowed and ignores extra keys", () => {
    const v = parseVerdict(JSON.stringify({ ...good, letteringFound: null, oldTextReadable: false, extra: 1 }));
    expect(v?.letteringFound).toBeNull();
    expect(v?.oldTextReadable).toBe(false);
    expect(v).not.toHaveProperty("extra");
  });

  it.each([
    ["motifMatch", "yes"],
    ["motifMatch", undefined],
    ["letteringFound", 5],
    ["letteringMatch", null],
    ["oldTextReadable", "no"],
    ["offensive", 0],
    ["reaction", null],
    ["reaction", 12],
    ["mood", "ecstatic"],
    ["mood", undefined],
  ])("rejects %s = %j", (field, value) => {
    const bad: Record<string, unknown> = { ...good };
    if (value === undefined) delete bad[field];
    else bad[field] = value;
    expect(parseVerdict(JSON.stringify(bad))).toBeNull();
  });

  it.each([["not json", "{nope"], ["array", "[]"], ["string", '"hi"'], ["null", "null"], ["empty", ""]])("rejects %s", (_, text) => {
    expect(parseVerdict(text)).toBeNull();
  });

  it("sanitizes the reaction", () => {
    const v = parseVerdict(JSON.stringify({ ...good, reaction: "**Bro** 🔥\n<b>nice</b>   `ink`" }));
    expect(v?.reaction).toBe("Bro nice ink");
  });
});

describe("sanitizeReaction", () => {
  it("keeps normal punctuation", () => {
    expect(sanitizeReaction("It's got her name. Probably! $5, right?")).toBe("It's got her name. Probably! $5, right?");
  });

  it("strips control characters and collapses whitespace", () => {
    expect(sanitizeReaction("a\u0000b\t\tc\r\n d")).toBe("ab c d");
  });

  it("caps at 140 characters", () => {
    const out = sanitizeReaction("word ".repeat(60));
    expect(out.length).toBeLessThanOrEqual(140);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("buildSystemPrompt", () => {
  it("tino-1 with stencil labels both images and uses server-side order data", () => {
    const p = buildSystemPrompt(getJob("tino-1"), { hasStencil: true, oldLettering: null });
    expect(p).toContain("Image 1 is the STENCIL");
    expect(p).toContain("Judge the motif and the lettering from the STENCIL");
    expect(p).toContain("Image 2 is the TATTOO ON SKIN");
    expect(p).toContain("React to the TATTOO ON SKIN");
    expect(p).toContain('Client: Tino Batista. Personality: Boat mechanic at the marina. Got engaged an hour ago.');
    expect(p).toContain('motif "heart", lettering "CRYSTAL"');
    expect(p).not.toContain("cover-up");
    expect(p).toContain("mood (one of: thrilled, happy, meh, angry).");
  });

  it("without a stencil keeps the original single-image sentence", () => {
    const p = buildSystemPrompt(getJob("kaylee-1"), { hasStencil: false, oldLettering: null });
    expect(p).toContain("on their shoulder."); // where the ink is, so the reaction doesn't guess
    expect(p).toContain("You see a tattoo on skin.");
    expect(p).not.toContain("STENCIL");
    expect(p).toContain('lettering "STAY LOUD"');
  });

  it("cover-up adds the old-lettering line and says lettering none", () => {
    const p = buildSystemPrompt(getJob("tino-2"), { hasStencil: true, oldLettering: "CRYSTAL" });
    expect(p).toContain('This is a cover-up. The old tattoo said "CRYSTAL". Report whether that old word is still readable.');
    expect(p).toContain('lettering "none"');
  });
});

describe("forceMode (JUDGE_FORCE)", () => {
  it("is ignored in production, whatever the value", () => {
    for (const v of ["offensive", "fallback", "slow"]) {
      expect(forceMode({ NODE_ENV: "production", JUDGE_FORCE: v })).toBeNull();
    }
  });

  it("works in development and test", () => {
    expect(forceMode({ NODE_ENV: "development", JUDGE_FORCE: "offensive" })).toBe("offensive");
    expect(forceMode({ NODE_ENV: "test", JUDGE_FORCE: "slow" })).toBe("slow");
  });

  it("ignores unknown values and unset", () => {
    expect(forceMode({ NODE_ENV: "development", JUDGE_FORCE: "chaos" })).toBeNull();
    expect(forceMode({ NODE_ENV: "development" })).toBeNull();
  });
});
