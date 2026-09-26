"use client";

import { useEffect, useMemo, useRef } from "react";
import { JOBS } from "@/data/jobs";
import { saveWall, type WallPiece } from "@/lib/game/wall";
import { thumbnail } from "@/lib/ink/dom";
import { shopRating, totalTips } from "@/lib/ink/score";
import { useGame } from "@/store/game";

export default function ShopWallScreen() {
  const results = useGame((s) => s.results);
  const saved = useRef(false);

  const pieces = useMemo(
    () =>
      JOBS.flatMap((job) => {
        const r = results[job.id];
        if (!r) return [];
        const scored = job.mode !== "free";
        return [{ job, result: r, stars: scored ? r.stars : null }];
      }),
    [results],
  );
  const tips = totalTips(pieces.map((p) => p.result));
  const rating = shopRating(pieces.flatMap((p) => (p.stars === null ? [] : [p.stars])));

  // Persist once per visit. Storage failing (private window, quota) just means no saved wall.
  useEffect(() => {
    if (saved.current || !pieces.length) return;
    saved.current = true;
    void (async () => {
      try {
        const wall: WallPiece[] = await Promise.all(
          pieces.map(async ({ job, result, stars }) => ({
            jobId: job.id,
            name: job.client.name,
            handle: job.client.handle,
            stars,
            tip: result.tip,
            thumb: await thumbnail(result.composite),
          })),
        );
        saveWall({ pieces: wall, totalTips: tips, rating, savedAt: Date.now() });
      } catch (err) {
        console.warn("[ShopWall] could not save the wall", err instanceof Error ? err.name : err);
      }
    })();
  }, [pieces, tips, rating]);

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Lights off · 3:40 AM</p>
          <h2 className="font-flash text-5xl leading-none text-paper sm:text-6xl">The shop wall</h2>
        </div>
        <dl className="flex gap-8">
          <div>
            <dt className="text-xs uppercase tracking-[0.3em] text-muted">Tips tonight</dt>
            <dd className="font-display text-3xl font-extrabold">${tips}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.3em] text-muted">Shop rating</dt>
            <dd className="font-display text-3xl font-extrabold text-sunset">{rating === null ? "—" : `${rating.toFixed(1)}★`}</dd>
          </div>
        </dl>
      </header>

      {pieces.length ? (
        <ul className="grid grid-cols-2 gap-5 rounded-2xl border border-white/5 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_96px),radial-gradient(ellipse_at_top,#2a1838,#120a1e)] p-5 sm:gap-8 sm:p-8 lg:grid-cols-4">
          {pieces.map(({ job, result, stars }) => (
            <li key={job.id} className="flash-frame flex flex-col gap-3 rounded-md border-[6px] border-frame bg-paper p-3 text-night shadow-[0_18px_40px_-10px_rgba(0,0,0,0.85)]">
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL composite */}
              <img src={result.composite} alt={`Tattoo for ${job.client.name}`} className="aspect-[4/5] w-full rounded bg-night object-cover" />
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-flash text-xl leading-none">{job.mode === "free" ? "Yours" : job.client.name}</p>
                <p className="text-sm">{stars === null ? "Not for sale" : `${"★".repeat(stars)}${"☆".repeat(5 - stars)}`}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">The wall is bare tonight.</p>
      )}

      <button
        type="button"
        onClick={() => useGame.getState().reset()}
        className="btn btn-primary self-start"
      >
        Restart shift
      </button>
    </section>
  );
}
