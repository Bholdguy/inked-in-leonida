import { describe, expect, it } from "vitest";
import { kayleeCallback, mustPostFirst, nextAfterJob } from "@/lib/game/flow";

describe("nextAfterJob", () => {
  it("follows PRD 8.1", () => {
    expect(nextAfterJob("tino-1")).toEqual({ advanceJob: true, screen: "ORDER" });
    expect(nextAfterJob("kaylee-1")).toEqual({ advanceJob: true, screen: "NIGHT_INTRO" });
    expect(nextAfterJob("tino-2")).toEqual({ advanceJob: true, screen: "FINALE_INTRO" });
    expect(nextAfterJob("self")).toEqual({ advanceJob: false, screen: "SHOP_WALL" });
  });
});

describe("kayleeCallback (PRD 9.3)", () => {
  it("picks the line from Kaylee's stars", () => {
    expect(kayleeCallback(5)).toBe("Kaylee's post hit 40K likes. Your DMs are on fire.");
    expect(kayleeCallback(4)).toBe("Kaylee's post hit 40K likes. Your DMs are on fire.");
    expect(kayleeCallback(3)).toBe("Kaylee posted it. Then archived it.");
    expect(kayleeCallback(2)).toBe("Kaylee posted a story about 'a certain shop'. You're the certain shop.");
    expect(kayleeCallback(1)).toBe("Kaylee posted a story about 'a certain shop'. You're the certain shop.");
  });

  it("has no line without a Kaylee result", () => {
    expect(kayleeCallback(undefined)).toBeNull();
  });
});

describe("mustPostFirst", () => {
  it("routes only the first verdict through InkGram", () => {
    expect(mustPostFirst("tino-1")).toBe(true);
    expect(mustPostFirst("kaylee-1")).toBe(false);
    expect(mustPostFirst("tino-2")).toBe(false);
    expect(mustPostFirst("self")).toBe(false);
  });
});
