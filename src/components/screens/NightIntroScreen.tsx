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
      className="night-card panel flex min-h-[62vh] w-full flex-col items-center justify-center gap-5 bg-[radial-gradient(ellipse_at_bottom,rgba(255,138,61,0.22),transparent_60%)] p-8 text-center focus-visible:outline-2 focus-visible:outline-teal"
    >
      <span className="neon neon-teal font-display text-sm tracking-[0.4em] sm:text-base">{card.title}</span>
      <span className="neon neon-flicker text-5xl sm:text-7xl">{card.line}</span>
      {callback && <span className="max-w-xl rounded-full border border-sunset/30 bg-sunset/10 px-5 py-2 text-lg text-sunset">{callback}</span>}
      <span className="mt-6 text-xs uppercase tracking-[0.3em] text-muted">Click to continue</span>
    </button>
  );
}
