"use client";

import { useGame } from "@/store/game";

export default function FinaleIntroScreen() {
  return (
    <section className="panel flex min-h-[62vh] flex-col items-center justify-center gap-6 bg-[radial-gradient(ellipse_at_bottom,rgba(255,62,154,0.18),transparent_60%)] p-8 text-center">
      <p className="eyebrow">Closing time · 3:02 AM</p>
      <h2 className="neon neon-flicker max-w-3xl text-5xl leading-tight sm:text-6xl">Shop&apos;s empty. Last chair&apos;s yours.</h2>
      <p className="max-w-md text-muted">No order, no client, no score. Every tool in the rail is unlocked. Ink whatever you want.</p>
      <button
        type="button"
        onClick={() => useGame.getState().goTo("SELF_SETUP")}
        className="btn btn-primary btn-lg"
      >
        Sit down
      </button>
    </section>
  );
}
