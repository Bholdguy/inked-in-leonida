"use client";

import { useEffect, useRef } from "react";
import { kayleeCallback, NIGHT_CARDS } from "@/lib/game/flow";
import { currentJob, useGame } from "@/store/game";

const AUTO_ADVANCE_MS = 2500;

export default function NightIntroScreen() {
  const job = useGame(currentJob);
  const kayleeStars = useGame((s) => s.results["kaylee-1"]?.stars);
  const done = useRef(false);
  const night = job.night === 2 ? 2 : 1;
  const card = NIGHT_CARDS[night];
  const callback = night === 2 ? kayleeCallback(kayleeStars) : null;

  const next = () => {
    if (done.current) return;
    done.current = true;
    useGame.getState().goTo("ORDER");
  };

  useEffect(() => {
    const t = setTimeout(next, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <button
      type="button"
      onClick={next}
      aria-label={`${card.title}. ${card.line} Continue`}
      className="night-card flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-panel p-8 text-center focus-visible:outline-2 focus-visible:outline-teal"
    >
      <span className="text-sm uppercase tracking-[0.4em] text-teal">{card.title}</span>
      <span className="text-4xl font-bold sm:text-5xl">{card.line}</span>
      {callback && <span className="max-w-xl text-lg text-sunset">{callback}</span>}
      <span className="mt-6 text-xs uppercase tracking-[0.3em] text-muted">Click to continue</span>
    </button>
  );
}
