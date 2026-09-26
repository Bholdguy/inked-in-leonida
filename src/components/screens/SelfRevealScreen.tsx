"use client";

import ShareActions from "@/components/ShareActions";
import { useGame } from "@/store/game";

export default function SelfRevealScreen() {
  const result = useGame((s) => s.results.self);
  const body = useGame((s) => s.selfBody);

  if (!result) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 panel p-6">
        <p className="font-bold">The last chair is still empty.</p>
        <button type="button" onClick={() => useGame.getState().goTo("SELF_SETUP")} className="btn btn-primary btn-sm">
          Back to your chair
        </button>
      </div>
    );
  }

  return (
    <section className="flex flex-col items-center gap-6">
      <h2 className="neon text-6xl tracking-[0.15em] sm:text-7xl">YOUR INK</h2>
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL composite */}
      <img
        src={result.composite}
        alt={`The tattoo you gave yourself on your ${body.zone}`}
        className="aspect-[4/5] w-full max-w-[560px] rounded-xl border border-white/10 bg-[radial-gradient(circle_at_50%_30%,#241838,var(--night))]"
      />
      <p className="text-muted">No client to please. No score. Just yours.</p>
      <ShareActions
        composite={result.composite}
        handle="@nightshift"
        stars={null}
        caption="Last chair of the night. Inked it myself."
        client={null}
        filename="inked-in-leonida-your-ink.png"
      />
      <button
        type="button"
        onClick={() => useGame.getState().advance()}
        className="btn btn-primary"
      >
        Hang it on the wall
      </button>
    </section>
  );
}
