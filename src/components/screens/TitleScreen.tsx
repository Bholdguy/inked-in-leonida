"use client";

import { useGame } from "@/store/game";

export default function TitleScreen() {
  const goTo = useGame((s) => s.goTo);
  return (
    <section className="flex flex-col items-start gap-6 py-10">
      <h2 className="text-5xl font-bold tracking-widest">INKED IN LEONIDA</h2>
      <p className="max-w-xl text-lg text-muted">Night shift on the strip. Their parlor is a menu. This one isn&apos;t.</p>
      <button
        type="button"
        onClick={() => goTo("NIGHT_INTRO")}
        className="rounded-lg bg-pink px-8 py-3 text-lg font-bold text-night transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
      >
        Open the shop
      </button>
    </section>
  );
}
