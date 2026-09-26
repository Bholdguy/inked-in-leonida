"use client";

import { useEffect, useState } from "react";
import SoundToggle from "@/components/SoundToggle";
import { loadWall, type SavedWall } from "@/lib/game/wall";
import { useGame } from "@/store/game";

export default function TitleScreen() {
  const goTo = useGame((s) => s.goTo);
  const [lastWall, setLastWall] = useState<SavedWall | null>(null);

  // After mount only: storage is browser-only and may be blocked (loadWall never throws).
  useEffect(() => setLastWall(loadWall()), []);

  return (
    <section className="relative isolate flex min-h-[78vh] flex-col items-center justify-center gap-8 overflow-hidden py-10 text-center">
      {/* Striped sunset sinking behind the sign. */}
      <div aria-hidden className="title-sun absolute left-1/2 top-[46%] -z-10 aspect-square w-[min(620px,92vw)] -translate-x-1/2 -translate-y-1/2" />

      <p className="eyebrow">Leonida strip · open late</p>

      <h1 className="flex flex-col items-center gap-1 leading-none">
        <span className="neon neon-teal font-display text-2xl tracking-[0.5em] sm:text-4xl">INKED IN</span>
        <span className="neon neon-flicker text-[clamp(3.4rem,13vw,9rem)] tracking-[0.06em]">LEONIDA</span>
      </h1>

      <p className="max-w-xl text-lg text-ink/85 sm:text-xl">
        Night shift on the strip. <span className="text-sunset">Their parlor is a menu. This one isn&apos;t.</span>
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => goTo("NIGHT_INTRO")} className="btn btn-primary btn-lg">
          Open the shop
        </button>
        <SoundToggle />
      </div>

      <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted">
        <li>Design every piece in a real image editor</li>
        <li>Place it anywhere on the skin</li>
        <li>Live with the reaction</li>
      </ul>

      {lastWall && (
        <aside aria-label="Your last shift" className="panel flex flex-wrap items-center justify-center gap-4 px-4 py-3">
          <div className="flex -space-x-3">
            {lastWall.pieces.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element -- saved data URL thumbnail
              <img key={p.jobId} src={p.thumb} alt="" className="h-16 w-12 rounded border-2 border-paper object-cover" />
            ))}
          </div>
          <p className="text-sm text-muted">
            Last shift: <span className="font-bold text-ink">${lastWall.totalTips}</span> in tips
            {lastWall.rating !== null && (
              <>
                {" · "}
                <span className="font-bold text-sunset">{lastWall.rating.toFixed(1)}★</span> shop rating
              </>
            )}
          </p>
        </aside>
      )}
    </section>
  );
}
