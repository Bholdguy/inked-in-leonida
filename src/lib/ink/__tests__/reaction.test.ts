import { describe, expect, it } from "vitest";
import type { Mood } from "@/types";
import { MOOD_SCALE, moodDistance, pickReaction } from "../reaction";

const canned: Record<Mood, string> = {
  thrilled: "canned thrilled",
  happy: "canned happy",
  meh: "canned meh",
  angry: "canned angry",
};

// Expected: model line when |scoreMood - modelMood| <= 1 on angry < meh < happy < thrilled.
const USE_MODEL: Record<Mood, Mood[]> = {
  angry: ["angry", "meh"],
  meh: ["angry", "meh", "happy"],
  happy: ["meh", "happy", "thrilled"],
  thrilled: ["happy", "thrilled"],
};

describe("pickReaction", () => {
  const combos = MOOD_SCALE.flatMap((scoreMood) => MOOD_SCALE.map((modelMood) => [scoreMood, modelMood] as const));
  it("covers all 16 combinations", () => expect(combos).toHaveLength(16));

  it.each(combos)("score %s, model %s", (scoreMood, modelMood) => {
    const got = pickReaction({ scoreMood, canned, model: { reaction: "model line", mood: modelMood } });
    expect(got).toBe(USE_MODEL[scoreMood].includes(modelMood) ? "model line" : canned[scoreMood]);
  });

  it("no model (fallback) -> canned line for the score mood", () => {
    expect(pickReaction({ scoreMood: "happy", canned })).toBe("canned happy");
    expect(pickReaction({ scoreMood: "meh", canned, model: null })).toBe("canned meh");
  });

  it("empty or whitespace model line -> canned", () => {
    expect(pickReaction({ scoreMood: "happy", canned, model: { reaction: "", mood: "happy" } })).toBe("canned happy");
    expect(pickReaction({ scoreMood: "happy", canned, model: { reaction: "   ", mood: "happy" } })).toBe("canned happy");
  });

  it("trims the model line", () => {
    expect(pickReaction({ scoreMood: "happy", canned, model: { reaction: "  nice  ", mood: "happy" } })).toBe("nice");
  });

  it("moodDistance", () => {
    expect(moodDistance("angry", "thrilled")).toBe(3);
    expect(moodDistance("happy", "meh")).toBe(1);
    expect(moodDistance("meh", "meh")).toBe(0);
  });
});
