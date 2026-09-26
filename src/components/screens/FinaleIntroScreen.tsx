"use client";

import { useGame } from "@/store/game";

export default function FinaleIntroScreen() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-6 rounded-2xl border border-white/10 bg-panel p-8 text-center">
      <p className="text-sm uppercase tracking-[0.4em] text-teal">Closing time · 3:02 AM</p>
      <h2 className="text-4xl font-bold sm:text-5xl">Shop&apos;s empty. Last chair&apos;s yours.</h2>
      <p className="max-w-md text-muted">No order, no client, no score. Every tool in the rail is unlocked. Ink whatever you want.</p>
      <button
        type="button"
        onClick={() => useGame.getState().goTo("SELF_SETUP")}
        className="rounded-lg bg-pink px-8 py-3 text-lg font-bold text-night transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
      >
        Sit down
      </button>
    </section>
  );
}
