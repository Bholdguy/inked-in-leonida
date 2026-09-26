import { describe, expect, it } from "vitest";
import { loadWall, saveWall, WALL_KEY, type SavedWall } from "@/lib/game/wall";

const wall: SavedWall = {
  pieces: [{ jobId: "tino-1", name: "Tino Batista", handle: "@tino.fixes.boats", stars: 4, tip: 145, thumb: "data:image/jpeg;base64,AAAA" }],
  totalTips: 145,
  rating: 4,
  savedAt: 1,
};

const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
};

const throwing = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
};

describe("shop wall storage", () => {
  it("round-trips a wall", () => {
    const s = memory();
    expect(saveWall(wall, s)).toBe(true);
    expect(s.m.has(WALL_KEY)).toBe(true);
    expect(loadWall(s)).toEqual(wall);
  });

  it("works when storage throws on every call", () => {
    expect(saveWall(wall, throwing)).toBe(false);
    expect(loadWall(throwing)).toBeNull();
  });

  it("works with no storage at all (server render, blocked storage)", () => {
    expect(saveWall(wall, null)).toBe(false);
    expect(loadWall(null)).toBeNull();
    expect(loadWall()).toBeNull(); // no window in the test environment
  });

  it("ignores corrupt or foreign entries", () => {
    const s = memory();
    s.setItem(WALL_KEY, "{not json");
    expect(loadWall(s)).toBeNull();
    s.setItem(WALL_KEY, JSON.stringify({ pieces: "nope", totalTips: 1 }));
    expect(loadWall(s)).toBeNull();
    s.setItem(WALL_KEY, JSON.stringify({ ...wall, pieces: [{ ...wall.pieces[0], thumb: "javascript:alert(1)" }] }));
    expect(loadWall(s)).toBeNull();
  });
});
