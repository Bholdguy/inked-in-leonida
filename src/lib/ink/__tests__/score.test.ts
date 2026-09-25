import { describe, expect, it } from "vitest";
import type { ColorName } from "@/types";
import { COLOR_NAMES } from "../color";
import { coveragePoints, moodFor, scoreCoverup, scoreStandard, starsFor, tipFor, type VisionVerdict } from "../score";

const shares = (s: Partial<Record<ColorName, number>>) =>
  ({ ...Object.fromEntries(COLOR_NAMES.map((c) => [c, 0])), ...s }) as Record<ColorName, number>;

const FALLBACK: VisionVerdict = { source: "fallback" };
const vision = (v: Partial<Extract<VisionVerdict, { source: "vision" }>>): VisionVerdict => ({
  source: "vision",
  motifMatch: false,
  letteringFound: null,
  letteringMatch: false,
  oldTextReadable: null,
  offensive: false,
  ...v,
});

const tino = { requiredColors: ["red", "black"] as ColorName[], forbiddenColors: [] as ColorName[], range: { min: 0.08, max: 0.4 } };

describe("scoreStandard", () => {
  it("Phase 1 best case on fallback = 80 (25 + 15 + 10 + 15 + 15)", () => {
    const r = scoreStandard({ ...tino, shares: shares({ red: 0.3, black: 0.6 }), coverage: 0.2, placementHit: true, vision: FALLBACK });
    expect(r.breakdown).toEqual({
      palette: { got: 25, max: 25 },
      coverage: { got: 15, max: 15 },
      placement: { got: 10, max: 10 },
      motif: { got: 15, max: 25 },
      lettering: { got: 15, max: 25 },
    });
    expect(r.total).toBe(80);
  });

  it("perfect vision run = 100", () => {
    const r = scoreStandard({
      ...tino,
      shares: shares({ red: 0.5, black: 0.5 }),
      coverage: 0.08,
      placementHit: true,
      vision: vision({ motifMatch: true, letteringMatch: true, letteringFound: "CRYSTAL" }),
    });
    expect(r.total).toBe(100);
  });

  it("mixed case = 45 (2.5 + 7.5 + 0 + 25 + 10)", () => {
    const r = scoreStandard({
      requiredColors: ["red", "black"],
      forbiddenColors: ["blue"],
      shares: shares({ red: 0.3, black: 0.02, blue: 0.2 }), // black below 0.05, blue forbidden above 0.10
      coverage: 0.06, // halfway between min/2 (0.04) and min (0.08)
      range: { min: 0.08, max: 0.4 },
      placementHit: false,
      vision: vision({ motifMatch: true, letteringMatch: false, letteringFound: "CRISTAL" }),
    });
    expect(r.breakdown.palette.got).toBe(2.5);
    expect(r.breakdown.coverage.got).toBeCloseTo(7.5);
    expect(r.breakdown.lettering.got).toBe(10);
    expect(r.total).toBe(45);
  });

  it("palette floors at 0", () => {
    const r = scoreStandard({
      requiredColors: ["red"],
      forbiddenColors: ["blue", "green"],
      shares: shares({ blue: 0.5, green: 0.5 }),
      coverage: 0.2,
      range: tino.range,
      placementHit: true,
      vision: FALLBACK,
    });
    expect(r.breakdown.palette.got).toBe(0);
  });

  it("no lettering found -> 0 lettering points", () => {
    const r = scoreStandard({ ...tino, shares: shares({ red: 0.5, black: 0.5 }), coverage: 0.2, placementHit: true, vision: vision({ motifMatch: true }) });
    expect(r.breakdown.lettering.got).toBe(0);
    expect(r.total).toBe(75);
  });

  it("offensive -> total 0", () => {
    const r = scoreStandard({ ...tino, shares: shares({ red: 0.5, black: 0.5 }), coverage: 0.2, placementHit: true, vision: vision({ offensive: true, motifMatch: true }) });
    expect(r.offensive).toBe(true);
    expect(r.total).toBe(0);
  });
});

describe("coveragePoints", () => {
  const range = { min: 0.08, max: 0.4 };
  it.each([
    [0.08, 15],
    [0.4, 15],
    [0.04, 0],
    [0.02, 0],
    [0.06, 7.5],
    [0.5, 7.5],
    [0.6, 0],
    [0.9, 0],
  ])("coverage %s -> %s", (c, pts) => expect(coveragePoints(c, range)).toBeCloseTo(pts));
});

describe("scoreCoverup", () => {
  it("vision case = 80 (20 + 20 + 15 + 25)", () => {
    const r = scoreCoverup({ concealment: 0.7, blackShare: 0.3, vision: vision({ motifMatch: true, oldTextReadable: false }) });
    expect(r.breakdown).toEqual({
      concealment: { got: 20, max: 40 },
      oldName: { got: 20, max: 20 },
      palette: { got: 15, max: 15 },
      motif: { got: 25, max: 25 },
    });
    expect(r.total).toBe(80);
  });

  it("fallback case = 75 (40 + 20 + 0 + 15)", () => {
    const r = scoreCoverup({ concealment: 0.9, blackShare: 0.1, vision: FALLBACK });
    expect(r.total).toBe(75);
  });

  it("fallback, concealment below 0.85 -> old name 0", () => {
    const r = scoreCoverup({ concealment: 0.84, blackShare: 0.5, vision: FALLBACK });
    expect(r.breakdown.oldName.got).toBe(0);
    expect(r.breakdown.concealment.got).toBeCloseTo(34);
    expect(r.total).toBe(64); // 34 + 0 + 15 + 15
  });

  it("old text still readable -> 0 for old name; concealment <= 0.5 -> 0", () => {
    const r = scoreCoverup({ concealment: 0.4, blackShare: 0.5, vision: vision({ motifMatch: true, oldTextReadable: true }) });
    expect(r.breakdown.oldName.got).toBe(0);
    expect(r.breakdown.concealment.got).toBe(0);
    expect(r.total).toBe(40);
  });
});

describe("stars, mood, tip", () => {
  it.each([
    [100, 5], [90, 5], [89, 4], [75, 4], [74, 3], [55, 3], [54, 2], [35, 2], [34, 1], [0, 1],
  ])("score %d -> %d stars", (score, stars) => expect(starsFor(score)).toBe(stars));

  it("mood from stars", () => {
    expect(moodFor(5)).toBe("thrilled");
    expect(moodFor(4)).toBe("happy");
    expect(moodFor(3)).toBe("meh");
    expect(moodFor(2)).toBe("angry");
    expect(moodFor(1)).toBe("angry");
  });

  it("tip = basePay * stars / 5 rounded to $5", () => {
    expect(tipFor(180, 4)).toBe(145); // 144 -> 145
    expect(tipFor(180, 5)).toBe(180);
    expect(tipFor(250, 3)).toBe(150);
    expect(tipFor(300, 1)).toBe(60);
    expect(tipFor(180, 1)).toBe(35); // 36 -> 35
  });
});
