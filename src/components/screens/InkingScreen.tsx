"use client";

import { useEffect, useRef } from "react";
import { finishJob } from "@/lib/game/evaluate";
import { requestJudgement } from "@/lib/game/judgeClient";
import { useGame } from "@/store/game";

// Plain INKING for Phase 2: fires the judge and waits (max 9 s). The sweep animation,
// fresh-ink halo and needle audio arrive in Phase 4 (4.2, 4.3).
const MIN_SHOW_MS = 1200; // so a fast fallback doesn't flash past

export default function InkingScreen() {
  const inking = useGame((s) => s.inking);
  const started = useRef(false); // survives the Strict Mode double effect

  useEffect(() => {
    if (!inking || started.current) return;
    started.current = true;
    const t0 = performance.now();
    void (async () => {
      const verdict = await requestJudgement(inking.job.id, inking.compositeJpegB64, inking.stencilJpegB64);
      const wait = MIN_SHOW_MS - (performance.now() - t0);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      useGame.getState().finishInking(inking.job.id, finishJob(inking, verdict));
    })();
  }, [inking]);

  if (!inking) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-white/10 bg-panel p-6">
        <p className="font-bold">The needle has nothing to ink.</p>
        <button type="button" onClick={() => useGame.getState().goTo("PLACEMENT")} className="rounded bg-pink px-4 py-2 font-bold text-night">
          Back to placement
        </button>
      </div>
    );
  }

  return (
    <section className="grid gap-6 md:grid-cols-[minmax(0,420px)_1fr] md:items-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL composite */}
      <img
        src={inking.composite}
        alt={`The tattoo going onto ${inking.job.client.name}'s ${inking.job.body.zone}`}
        className="aspect-[4/5] w-full rounded-xl border border-white/10 bg-[radial-gradient(circle_at_50%_30%,#241838,var(--night))]"
      />
      <div role="status" aria-live="polite" className="flex flex-col gap-2">
        <p className="text-2xl font-bold">The needle&apos;s working…</p>
        <p className="text-muted">{inking.job.client.name} is watching every line.</p>
      </div>
    </section>
  );
}
