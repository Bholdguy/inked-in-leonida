import { describe, expect, it } from "vitest";
import { loadSound, saveSound, SOUND_KEY } from "@/lib/game/prefs";

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

describe("sound preference", () => {
  it("is off by default", () => {
    expect(loadSound(memory())).toBe(false);
    expect(loadSound()).toBe(false); // no window in tests
  });

  it("round-trips on and off", () => {
    const s = memory();
    saveSound(true, s);
    expect(s.m.get(SOUND_KEY)).toBe("on");
    expect(loadSound(s)).toBe(true);
    saveSound(false, s);
    expect(loadSound(s)).toBe(false);
  });

  it("never throws when storage does", () => {
    expect(() => saveSound(true, throwing)).not.toThrow();
    expect(loadSound(throwing)).toBe(false);
    expect(() => saveSound(true, null)).not.toThrow();
  });
});
