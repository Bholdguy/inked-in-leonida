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
          <p className="text-xs uppercase tracking-[0.4em] text-teal">Lights off · 3:40 AM</p>
          <h2 className="text-4xl font-bold sm:text-5xl">The shop wall</h2>
        </div>
        <dl className="flex gap-8">
          <div>
            <dt className="text-xs uppercase tracking-[0.3em] text-muted">Tips tonight</dt>
            <dd className="text-3xl font-bold">${tips}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.3em] text-muted">Shop rating</dt>
            <dd className="text-3xl font-bold text-sunset">{rating === null ? "—" : `${rating.toFixed(1)}★`}</dd>
          </div>
        </dl>
      </header>

      {pieces.length ? (
        <ul className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {pieces.map(({ job, result, stars }) => (
            <li key={job.id} className="flash-frame flex flex-col gap-3 rounded-lg border-4 border-[#3a2a1c] bg-[#f4ede4] p-3 text-night shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL composite */}
              <img src={result.composite} alt={`Tattoo for ${job.client.name}`} className="aspect-[4/5] w-full rounded bg-night object-cover" />
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-bold">{job.mode === "free" ? "Yours" : job.client.name}</p>
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
        className="self-start rounded-lg bg-pink px-6 py-3 font-bold text-night transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
      >
        Restart shift
      </button>
    </section>
  );
}
