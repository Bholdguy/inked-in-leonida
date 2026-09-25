import { create } from "zustand";
import type { JobId, JobResult, Placement } from "@/types";
import { JOBS } from "@/data/jobs";

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
  sound: boolean;
  goTo: (screen: Screen) => void;
  setStencil: (dataUrl: string) => void;
  setPlacement: (placement: Placement) => void;
  saveResult: (jobId: JobId, result: JobResult) => void;
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
  sound: false,
};

export const useGame = create<GameState>()((set) => ({
  ...initial,
  goTo: (screen) => set({ screen }),
  setStencil: (stencil) => set((s) => ({ draft: { ...s.draft, stencil } })),
  setPlacement: (placement) => set((s) => ({ draft: { ...s.draft, placement } })),
  saveResult: (jobId, result) => set((s) => ({ results: { ...s.results, [jobId]: result } })),
  nextJob: () =>
    set((s) => ({ jobIndex: Math.min(s.jobIndex + 1, JOBS.length - 1), draft: EMPTY_DRAFT, screen: "ORDER" })),
  toggleSound: () => set((s) => ({ sound: !s.sound })),
  reset: () => set({ ...initial }),
}));

export const currentJob = (state: Pick<GameState, "jobIndex">) => JOBS[state.jobIndex];
