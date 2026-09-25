import { beforeEach, describe, expect, it } from "vitest";
import { currentJob, useGame } from "@/store/game";
import type { JobResult } from "@/types";

const result: JobResult = {
  stencil: "data:image/jpeg;base64,AAAA",
  composite: "data:image/png;base64,AAAA",
  placement: { cx: 0.5, cy: 0.5, scale: 1, rotate: 0 },
  score: 80,
  breakdown: {},
  stars: 4,
  mood: "happy",
  reaction: "ok",
  tip: 145,
  source: "fallback",
};

describe("game store", () => {
  beforeEach(() => useGame.getState().reset());

  it("starts on Tino's order", () => {
    const s = useGame.getState();
    expect(s.screen).toBe("ORDER");
    expect(currentJob(s).id).toBe("tino-1");
    expect(s.sound).toBe(false);
  });

  it("walks a job and keeps the draft until the next job", () => {
    const g = useGame.getState();
    g.goTo("STUDIO");
    g.setStencil("data:image/jpeg;base64,STENCIL");
    g.setPlacement({ cx: 0.4, cy: 0.5, scale: 0.8, rotate: 10 });
    g.saveResult("tino-1", result);
    g.goTo("VERDICT");

    let s = useGame.getState();
    expect(s.screen).toBe("VERDICT");
    expect(s.draft.stencil).toBe("data:image/jpeg;base64,STENCIL");
    expect(s.results["tino-1"]?.score).toBe(80);

    s.nextJob();
    s = useGame.getState();
    expect(currentJob(s).id).toBe("kaylee-1");
    expect(s.screen).toBe("ORDER");
    expect(s.draft).toEqual({ stencil: null, placement: null });
    expect(s.results["tino-1"]).toBeDefined();
  });

  it("reset clears everything", () => {
    const g = useGame.getState();
    g.saveResult("tino-1", result);
    g.toggleSound();
    g.nextJob();
    g.reset();
    const s = useGame.getState();
    expect(s.jobIndex).toBe(0);
    expect(s.results).toEqual({});
    expect(s.sound).toBe(false);
  });
});
