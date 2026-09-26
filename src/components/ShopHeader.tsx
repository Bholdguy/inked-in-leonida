"use client";

import SoundToggle from "@/components/SoundToggle";
import { totalTips } from "@/lib/ink/score";
import { currentJob, useGame } from "@/store/game";
import type { JobResult } from "@/types";

export default function ShopHeader() {
  const job = useGame(currentJob);
  const results = useGame((s) => s.results);
  const tips = totalTips(Object.values(results).filter((r): r is JobResult => !!r));
  const night = job.mode === "free" ? "Closing time" : `Night ${job.night}`;

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="neon text-2xl tracking-[0.12em] sm:text-3xl">INKED IN LEONIDA</h1>
        <p className="mt-1 text-xs uppercase tracking-[0.3em] text-muted">Night shift on the strip</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <dl className="flex items-center gap-2 text-sm">
          <div className="rounded-full border border-white/10 bg-night/60 px-3 py-1.5">
            <dt className="sr-only">Shift</dt>
            <dd className="text-teal">{night}</dd>
          </div>
          <div className="rounded-full border border-white/10 bg-night/60 px-3 py-1.5">
            <dt className="inline text-muted">Tips </dt>
            <dd className="inline font-bold text-sunset">${tips}</dd>
          </div>
        </dl>
        <SoundToggle />
      </div>
    </header>
  );
}
