import { describe, expect, it } from "vitest";
import { formatLikes, likeCount, shareText, wrapLines, xIntentUrl } from "@/lib/share/social";

describe("likeCount", () => {
  it("is stars times a stable 180-420 per job", () => {
    for (const id of ["tino-1", "kaylee-1", "tino-2"]) {
      const per = likeCount(id, 1);
      expect(per).toBeGreaterThanOrEqual(180);
      expect(per).toBeLessThanOrEqual(420);
      expect(likeCount(id, 4)).toBe(per * 4);
      expect(likeCount(id, 4)).toBe(likeCount(id, 4));
    }
  });

  it("formats thousands", () => {
    expect(formatLikes(950)).toBe("950");
    expect(formatLikes(1200)).toBe("1.2K");
    expect(formatLikes(2000)).toBe("2K");
  });
});

describe("share text and X intent (PRD 11.4)", () => {
  it("builds the prefilled post", () => {
    expect(shareText("Tino Batista", 5, "https://example.test")).toBe(
      "I just inked Tino Batista at a Leonida tattoo shop. 5★ https://example.test #BuiltWithImageEditor @unlayer",
    );
    expect(shareText(null, null, "https://example.test")).toBe(
      "I just inked myself at a Leonida tattoo shop. https://example.test #BuiltWithImageEditor @unlayer",
    );
  });

  it("encodes the text into the x.com intent URL", () => {
    const url = xIntentUrl("5★ #BuiltWithImageEditor @unlayer");
    expect(url.startsWith("https://x.com/intent/post?text=")).toBe(true);
    expect(decodeURIComponent(url.split("text=")[1])).toBe("5★ #BuiltWithImageEditor @unlayer");
    expect(url).not.toContain("#");
  });
});

describe("wrapLines", () => {
  const measure = (s: string) => s.length; // 1 unit per character

  it("wraps words into lines that fit", () => {
    expect(wrapLines("aaa bbb ccc", 7, measure)).toEqual(["aaa bbb", "ccc"]);
  });

  it("keeps at most two lines and ends with an ellipsis", () => {
    const lines = wrapLines("one two three four five six", 9, measure);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith("…")).toBe(true);
    for (const l of lines) expect(measure(l)).toBeLessThanOrEqual(9);
  });

  it("handles short and empty text", () => {
    expect(wrapLines("hi", 10, measure)).toEqual(["hi"]);
    expect(wrapLines("   ", 10, measure)).toEqual([]);
  });
});
