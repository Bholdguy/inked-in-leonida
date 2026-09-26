import { create } from "zustand";
import type { BodyZone, Job, JobId, JobResult, Placement, SkinTone } from "@/types";
import { JOBS } from "@/data/jobs";
import { nextAfterJob } from "@/lib/game/flow";
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

export interface SelfBody {
  zone: Extract<BodyZone, "forearm" | "back">;
  tone: SkinTone;
}

interface GameState {
  screen: Screen;
  jobIndex: number;
  results: Partial<Record<JobId, JobResult>>;
  draft: Draft;
  inking: PreparedJob | null; // locked in, waiting for the judge
  selfBody: SelfBody; // finale: chosen in SELF_SETUP
  sound: boolean;
  goTo: (screen: Screen) => void;
  setStencil: (dataUrl: string) => void;
  setPlacement: (placement: Placement) => void;
  saveResult: (jobId: JobId, result: JobResult) => void;
  startInking: (prepared: PreparedJob) => void;
  finishInking: (jobId: JobId, result: JobResult) => void;
  startOver: (jobId: JobId) => void;
  advance: () => void;
  setSelfBody: (body: SelfBody) => void;
  setSound: (on: boolean) => void;
  toggleSound: () => void;
  reset: () => void;
}

const EMPTY_DRAFT: Draft = { stencil: null, placement: null };

const initial = {
  screen: "TITLE" as Screen,
  jobIndex: 0,
  results: {},
  draft: EMPTY_DRAFT,
  inking: null as PreparedJob | null,
  selfBody: { zone: "forearm", tone: "deep" } as SelfBody,
};

export const useGame = create<GameState>()((set) => ({
  ...initial,
  sound: false,
  goTo: (screen) => set({ screen }),
  setStencil: (stencil) => set((s) => ({ draft: { ...s.draft, stencil } })),
  setPlacement: (placement) => set((s) => ({ draft: { ...s.draft, placement } })),
  saveResult: (jobId, result) => set((s) => ({ results: { ...s.results, [jobId]: result } })),
  startInking: (prepared) => set({ inking: prepared, screen: "INKING" }),
  // The finale has no verdict: it goes straight to the reveal.
  finishInking: (jobId, result) =>
    set((s) => ({
      results: { ...s.results, [jobId]: result },
      inking: null,
      screen: jobId === "self" ? "SELF_REVEAL" : "VERDICT",
    })),
  // Offensive verdict: drop this attempt and reopen a fresh STUDIO for the same job.
  startOver: (jobId) =>
    set((s) => {
      const results = { ...s.results };
      delete results[jobId];
      return { results, draft: EMPTY_DRAFT, inking: null, screen: "STUDIO" };
    }),
  // After a verdict (or the reveal): next client, night 2 intro, the finale, or the wall.
  advance: () =>
    set((s) => {
      const { advanceJob, screen } = nextAfterJob(JOBS[s.jobIndex].id);
      const jobIndex = advanceJob ? Math.min(s.jobIndex + 1, JOBS.length - 1) : s.jobIndex;
      return { jobIndex, screen, draft: EMPTY_DRAFT, inking: null };
    }),
  setSelfBody: (selfBody) => set({ selfBody }),
  setSound: (sound) => set({ sound }),
  toggleSound: () => set((s) => ({ sound: !s.sound })),
  // Restart keeps the sound preference.
  reset: () => set({ ...initial }),
}));

// The finale's job carries the body picked in SELF_SETUP. Cached per body so zustand selectors
// get a stable object (a fresh one every call would re-render forever).
const selfJobs = new Map<string, Job>();
function selfJob(body: SelfBody): Job {
  const key = `${body.zone}-${body.tone}`;
  let job = selfJobs.get(key);
  if (!job) {
    job = { ...JOBS.find((j) => j.id === "self")!, body: { ...body } };
    selfJobs.set(key, job);
  }
  return job;
}

export const currentJob = (state: Pick<GameState, "jobIndex" | "selfBody">): Job => {
  const job = JOBS[state.jobIndex];
  return job.mode === "free" ? selfJob(state.selfBody) : job;
};

// Dev-only debugging handle (removed from production builds).
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  (window as unknown as { __game?: typeof useGame }).__game = useGame;
}
