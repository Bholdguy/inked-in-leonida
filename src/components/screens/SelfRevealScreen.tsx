"use client";

import { useGame } from "@/store/game";

export default function SelfRevealScreen() {
  const result = useGame((s) => s.results.self);
  const body = useGame((s) => s.selfBody);

  if (!result) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-white/10 bg-panel p-6">
        <p className="font-bold">The last chair is still empty.</p>
        <button type="button" onClick={() => useGame.getState().goTo("SELF_SETUP")} className="rounded bg-pink px-4 py-2 font-bold text-night">
          Back to your chair
        </button>
      </div>
    );
  }

  return (
    <section className="flex flex-col items-center gap-6">
      <h2 className="text-5xl font-bold tracking-widest">YOUR INK</h2>
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL composite */}
      <img
        src={result.composite}
        alt={`The tattoo you gave yourself on your ${body.zone}`}
        className="aspect-[4/5] w-full max-w-[560px] rounded-xl border border-white/10 bg-[radial-gradient(circle_at_50%_30%,#241838,var(--night))]"
      />
      <p className="text-muted">No client to please. No score. Just yours.</p>
      <button
        type="button"
        onClick={() => useGame.getState().advance()}
        className="rounded-lg bg-pink px-6 py-3 font-bold text-night transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
      >
        Hang it on the wall
      </button>
    </section>
  );
}
