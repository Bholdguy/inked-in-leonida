import { create } from "zustand";
import type { JobId, JobResult, Placement } from "@/types";
import { JOBS } from "@/data/jobs";
import type { PreparedJob } from "@/lib/game/evaluate";

export type Screen =
  | "TITLE"
  | "NIGHT_INTRO"
  | "ORDER"
  | "STUDIO"
  | "PLACEMENT"
  | "INKING"
  | "VERDICT"
  | "INKGRAM"
  | "FINALE_INTRO"
  | "SELF_SETUP"
  | "SELF_REVEAL"
  | "SHOP_WALL";

// Work in progress for the current job, before it becomes a JobResult.
export interface Draft {
  stencil: string | null;
  placement: Placement | null;
}

interface GameState {
  screen: Screen;
  jobIndex: number;
  results: Partial<Record<JobId, JobResult>>;
  draft: Draft;
  inking: PreparedJob | null; // locked in, waiting for the judge
  sound: boolean;
  goTo: (screen: Screen) => void;
  setStencil: (dataUrl: string) => void;
  setPlacement: (placement: Placement) => void;
  saveResult: (jobId: JobId, result: JobResult) => void;
  startInking: (prepared: PreparedJob) => void;
  finishInking: (jobId: JobId, result: JobResult) => void;
  startOver: (jobId: JobId) => void;
  nextJob: () => void;
  toggleSound: () => void;
  reset: () => void;
}

const EMPTY_DRAFT: Draft = { stencil: null, placement: null };

// Phase 1 starts on Tino's order; TITLE and NIGHT_INTRO arrive in later phases.
const initial = {
  screen: "ORDER" as Screen,
  jobIndex: 0,
  results: {},
  draft: EMPTY_DRAFT,
  inking: null as PreparedJob | null,
  sound: false,
};

export const useGame = create<GameState>()((set) => ({
  ...initial,
  goTo: (screen) => set({ screen }),
  setStencil: (stencil) => set((s) => ({ draft: { ...s.draft, stencil } })),
  setPlacement: (placement) => set((s) => ({ draft: { ...s.draft, placement } })),
  saveResult: (jobId, result) => set((s) => ({ results: { ...s.results, [jobId]: result } })),
  startInking: (prepared) => set({ inking: prepared, screen: "INKING" }),
  finishInking: (jobId, result) =>
    set((s) => ({ results: { ...s.results, [jobId]: result }, inking: null, screen: "VERDICT" })),
  // Offensive verdict: drop this attempt and reopen a fresh STUDIO for the same job.
  startOver: (jobId) =>
    set((s) => {
      const results = { ...s.results };
      delete results[jobId];
      return { results, draft: EMPTY_DRAFT, inking: null, screen: "STUDIO" };
    }),
  nextJob: () =>
    set((s) => ({ jobIndex: Math.min(s.jobIndex + 1, JOBS.length - 1), draft: EMPTY_DRAFT, inking: null, screen: "ORDER" })),
  toggleSound: () => set((s) => ({ sound: !s.sound })),
  reset: () => set({ ...initial }),
}));

export const currentJob = (state: Pick<GameState, "jobIndex">) => JOBS[state.jobIndex];

// Dev-only debugging handle (removed from production builds).
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  (window as unknown as { __game?: typeof useGame }).__game = useGame;
}
