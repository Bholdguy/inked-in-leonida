"use client";

import ClientBadge from "@/components/ClientBadge";
import { currentJob, useGame } from "@/store/game";
import type { Mood } from "@/types";

const PART_LABELS: Record<string, string> = {
  palette: "Palette",
  coverage: "Size",
  placement: "Placement",
  motif: "Motif",
  lettering: "Lettering",
  concealment: "Cover-up",
  oldName: "Old name gone",
};

const MOOD_STYLE: Record<Mood, string> = {
  thrilled: "border-teal text-teal",
  happy: "border-teal/60 text-teal/90",
  meh: "border-sunset text-sunset",
  angry: "border-pink text-pink",
};

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

export default function VerdictScreen({ onDone }: { onDone: () => void }) {
  const job = useGame(currentJob);
  const result = useGame((s) => s.results[job.id]);

  if (!result) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-white/10 bg-panel p-6">
        <p className="font-bold">No verdict yet.</p>
        <button type="button" onClick={() => useGame.getState().goTo("ORDER")} className="rounded bg-pink px-4 py-2 font-bold text-night">
          Back to the order
        </button>
      </div>
    );
  }

  return (
    <section className="grid gap-6 md:grid-cols-[minmax(0,420px)_1fr] md:items-start">
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL composite */}
      <img
        src={result.composite}
        alt={`The finished tattoo on ${job.client.name}'s ${job.body.zone}`}
        className="aspect-[4/5] w-full rounded-xl border border-white/10 bg-[radial-gradient(circle_at_50%_30%,#241838,var(--night))]"
      />

      <div className="flex flex-col gap-5 rounded-xl border border-white/10 bg-panel p-6">
        <div className="flex items-center gap-3">
          <ClientBadge client={job.client} size={48} />
          <div>
            <p className="font-bold">{job.client.name}</p>
            <p className="text-xs text-muted">{job.client.handle}</p>
          </div>
          <span className={`ml-auto rounded-full border-2 px-3 py-1 text-xs font-bold tracking-[0.2em] ${MOOD_STYLE[result.mood]}`}>
            {result.mood.toUpperCase()}
          </span>
        </div>

        <p className="text-2xl font-bold leading-snug">“{result.reaction}”</p>

        {result.source === "fallback" && (
          // The judge didn't answer (no key, timeout, bad reply). Diegetic, never error jargon.
          <p className="-mt-3 self-start rounded-full border border-white/15 px-3 py-0.5 text-xs italic text-muted">
            Client squinted at it.
          </p>
        )}

        <div className="flex flex-wrap items-end gap-6">
          <p aria-label={`${result.stars} out of 5 stars`} className="text-3xl tracking-widest text-sunset">
            {"★".repeat(result.stars)}
            <span className="text-white/15">{"★".repeat(5 - result.stars)}</span>
          </p>
          <p className="text-sm text-muted">
            Tip <span className="text-2xl font-bold text-ink">${result.tip}</span>
          </p>
          <p className="text-sm text-muted">
            Score <span className="text-2xl font-bold text-ink">{result.score}</span>/100
          </p>
        </div>

        {result.offensive && (
          <p role="alert" className="rounded-lg border border-pink/40 bg-pink/10 px-4 py-2 text-sm text-pink">
            {job.client.name.split(" ")[0]} won&apos;t wear that. Score zeroed, no tip. Draw something else.
          </p>
        )}

        <ul className="flex flex-col gap-3" aria-label="Score breakdown">
          {Object.entries(result.breakdown).map(([key, { got, max }]) => (
            <li key={key} className="text-sm">
              <div className="mb-1 flex justify-between">
                <span>{PART_LABELS[key] ?? key}</span>
                <span className="text-muted">
                  {fmt(got)} / {max}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-pink" style={{ width: `${(got / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={result.offensive ? () => useGame.getState().startOver(job.id) : onDone}
          className="self-start rounded-lg bg-pink px-6 py-3 font-bold text-night transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          {result.offensive ? "Start over" : "Restart shift"}
        </button>
      </div>
    </section>
  );
}
