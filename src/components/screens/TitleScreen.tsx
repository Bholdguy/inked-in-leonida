"use client";

import { useEffect, useState } from "react";
import { loadWall, type SavedWall } from "@/lib/game/wall";
import { useGame } from "@/store/game";

export default function TitleScreen() {
  const goTo = useGame((s) => s.goTo);
  const [lastWall, setLastWall] = useState<SavedWall | null>(null);

  // After mount only: storage is browser-only and may be blocked (loadWall never throws).
  useEffect(() => setLastWall(loadWall()), []);

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

      {lastWall && (
        <aside aria-label="Your last shift" className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-panel/70 p-3">
          <div className="flex -space-x-3">
            {lastWall.pieces.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element -- saved data URL thumbnail
              <img key={p.jobId} src={p.thumb} alt="" className="h-16 w-12 rounded border-2 border-[#f4ede4] object-cover" />
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
