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
  offensive: false,
};

describe("game store", () => {
  beforeEach(() => useGame.getState().reset());

  it("starts on the title with Tino as the first client", () => {
    const s = useGame.getState();
    expect(s.screen).toBe("TITLE");
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

    s.advance();
    s = useGame.getState();
    expect(currentJob(s).id).toBe("kaylee-1");
    expect(s.screen).toBe("ORDER");
    expect(s.draft).toEqual({ stencil: null, placement: null });
    expect(s.results["tino-1"]).toBeDefined();
  });

  it("inking: start holds the prepared job, finish saves the result and shows the verdict", () => {
    const prepared = { job: currentJob(useGame.getState()) } as unknown as Parameters<ReturnType<typeof useGame.getState>["startInking"]>[0];
    useGame.getState().startInking(prepared);
    expect(useGame.getState().screen).toBe("INKING");
    expect(useGame.getState().inking).toBe(prepared);
    useGame.getState().finishInking("tino-1", result);
    const s = useGame.getState();
    expect(s.screen).toBe("VERDICT");
    expect(s.inking).toBeNull();
    expect(s.results["tino-1"]).toBe(result);
  });

  it("startOver drops this attempt and reopens the studio for the same job", () => {
    const g = useGame.getState();
    g.saveResult("tino-1", { ...result, offensive: true, score: 0 });
    g.setStencil("data:image/jpeg;base64,BAD");
    g.setPlacement({ cx: 0.5, cy: 0.5, scale: 1, rotate: 0 });
    g.goTo("VERDICT");
    g.startOver("tino-1");
    const s = useGame.getState();
    expect(s.screen).toBe("STUDIO");
    expect(currentJob(s).id).toBe("tino-1");
    expect(s.results["tino-1"]).toBeUndefined();
    expect(s.draft).toEqual({ stencil: null, placement: null });
    expect(s.inking).toBeNull();
  });

  it("reset clears everything", () => {
    const g = useGame.getState();
    g.saveResult("tino-1", result);
    g.toggleSound();
    g.advance();
    g.setSelfBody({ zone: "back", tone: "light" });
    g.reset();
    const s = useGame.getState();
    expect(s.jobIndex).toBe(0);
    expect(s.screen).toBe("TITLE");
    expect(s.results).toEqual({});
    expect(s.selfBody).toEqual({ zone: "forearm", tone: "deep" });
    expect(s.sound).toBe(true); // the sound preference survives a restart
    g.setSound(false);
  });

  it("advance walks the whole shift: tino-1, kaylee-1, night 2, tino-2, finale, wall", () => {
    const g = useGame.getState();
    const seen: string[] = [];
    const step = () => {
      useGame.getState().advance();
      const s = useGame.getState();
      seen.push(`${currentJob(s).id}:${s.screen}`);
    };
    g.setStencil("data:image/jpeg;base64,X");
    step();
    expect(useGame.getState().draft).toEqual({ stencil: null, placement: null });
    step();
    step();
    step();
    expect(seen).toEqual(["kaylee-1:ORDER", "tino-2:NIGHT_INTRO", "self:FINALE_INTRO", "self:SHOP_WALL"]);
  });

  it("the finale job carries the chosen body and is a stable object", () => {
    const g = useGame.getState();
    g.advance();
    g.advance();
    g.advance();
    g.setSelfBody({ zone: "back", tone: "medium" });
    const a = currentJob(useGame.getState());
    const b = currentJob(useGame.getState());
    expect(a.id).toBe("self");
    expect(a.body).toEqual({ zone: "back", tone: "medium" });
    expect(a).toBe(b);
  });

  it("finishing the finale goes to the reveal, not a verdict", () => {
    useGame.getState().finishInking("self", result);
    expect(useGame.getState().screen).toBe("SELF_REVEAL");
  });

  it("tino-1: VERDICT -> INKGRAM (the only way on) -> Next client -> kaylee-1 ORDER", () => {
    const g = useGame.getState();
    g.finishInking("tino-1", result);
    expect(useGame.getState().screen).toBe("VERDICT");
    useGame.getState().goTo("INKGRAM"); // "Post to InkGram", the only button on this verdict
    useGame.getState().advance(); // INKGRAM "Next client"
    const s = useGame.getState();
    expect(s.screen).toBe("ORDER");
    expect(currentJob(s).id).toBe("kaylee-1");
    expect(s.results["tino-1"]).toBe(result);
  });
});
