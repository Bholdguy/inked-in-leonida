// PRD 8.1 shift flow as pure data, so the store stays a thin wrapper and the order is tested.
import type { JobId } from "@/types";

export type FlowScreen = "ORDER" | "NIGHT_INTRO" | "FINALE_INTRO" | "SHOP_WALL";

/** Where a finished job leads. Night 2 opens with an intro; the cover-up leads into the finale. */
export function nextAfterJob(jobId: JobId): { advanceJob: boolean; screen: FlowScreen } {
  switch (jobId) {
    case "tino-1":
      return { advanceJob: true, screen: "ORDER" };
    case "kaylee-1":
      return { advanceJob: true, screen: "NIGHT_INTRO" };
    case "tino-2":
      return { advanceJob: true, screen: "FINALE_INTRO" };
    case "self":
      return { advanceJob: false, screen: "SHOP_WALL" };
  }
}

// The first verdict only offers "Post to InkGram", so every player sees the share flow once.
export function mustPostFirst(jobId: JobId): boolean {
  return jobId === "tino-1";
}

// PRD 9.3: one line on NIGHT_INTRO(2) from Kaylee's stars. No result (should not happen) -> no line.
export function kayleeCallback(stars: number | undefined): string | null {
  if (stars === undefined) return null;
  if (stars >= 4) return "Kaylee's post hit 40K likes. Your DMs are on fire.";
  if (stars === 3) return "Kaylee posted it. Then archived it.";
  return "Kaylee posted a story about 'a certain shop'. You're the certain shop.";
}

export const NIGHT_CARDS: Record<1 | 2, { title: string; line: string }> = {
  1: { title: "NIGHT 1 · 11:48 PM", line: "The strip is loud." },
  2: { title: "NIGHT 2 · 12:10 AM", line: "Somebody's back." },
};
