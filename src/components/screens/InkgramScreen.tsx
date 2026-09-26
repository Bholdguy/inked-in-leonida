"use client";

import ClientBadge from "@/components/ClientBadge";
import ShareActions from "@/components/ShareActions";
import { nextLabel } from "@/lib/game/flow";
import { formatLikes, likeCount } from "@/lib/share/social";
import { currentJob, useGame } from "@/store/game";

export default function InkgramScreen() {
  const job = useGame(currentJob);
  const result = useGame((s) => s.results[job.id]);

  if (!result) {
    return (
      <div role="alert" className="panel flex flex-col items-start gap-3 p-6">
        <p className="font-bold">Nothing to post yet.</p>
        <button type="button" onClick={() => useGame.getState().goTo("ORDER")} className="btn btn-primary btn-sm">
          Back to the order
        </button>
      </div>
    );
  }

  const likes = likeCount(job.id, result.stars);
  const next = nextLabel(job.id);
  const user = job.client.handle.replace(/^@/, "");

  return (
    <section className="grid items-start gap-8 md:grid-cols-[minmax(0,440px)_1fr]">
      {/* The in-world feed post. */}
      <article className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#120b1d] shadow-[0_30px_80px_-30px_rgba(255,62,154,0.5)]">
        <header className="flex items-center gap-3 px-4 py-3">
          <ClientBadge client={job.client} size={36} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{user}</p>
            <p className="text-xs text-muted">Leonida · fresh ink</p>
          </div>
          <span className="ml-auto font-display text-sm font-extrabold tracking-wide text-pink">InkGram</span>
        </header>
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL composite */}
        <img
          src={result.composite}
          alt={`${job.client.name}'s new tattoo`}
          className="aspect-[4/5] w-full bg-[radial-gradient(circle_at_50%_30%,#241838,var(--night))]"
        />
        <div className="flex flex-col gap-2 px-4 py-3 text-sm">
          <div className="flex items-center gap-3 text-ink">
            <svg aria-hidden viewBox="0 0 24 24" className="size-6 text-pink" fill="currentColor">
              <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 5 6.4 5c2 0 3.4 1.1 4.1 2.3h3C14.2 6.1 15.6 5 17.6 5 21 5 23.1 8.4 21.6 11.8 19.5 16.4 12 21 12 21Z" />
            </svg>
            <span className="font-bold">{formatLikes(likes)} likes</span>
            <span aria-label={`${result.stars} out of 5 stars`} className="ml-auto tracking-widest text-sunset">
              {"★".repeat(result.stars)}
              <span className="text-white/20">{"★".repeat(5 - result.stars)}</span>
            </span>
          </div>
          <p>
            <span className="font-bold">{user}</span> {result.reaction}
          </p>
          <p className="text-xs text-muted">#freshink #leonida #nightshift</p>
        </div>
      </article>

      <div className="panel flex flex-col gap-5 p-6">
        <p className="eyebrow">Posted to InkGram</p>
        <h2 className="font-display text-3xl font-bold">
          {job.client.name.split(" ")[0]} posted it. {formatLikes(likes)} likes and counting.
        </h2>
        <ShareActions
          composite={result.composite}
          handle={job.client.handle}
          stars={result.stars}
          caption={result.reaction}
          client={job.client.name}
          filename={`inked-in-leonida-${job.id}.png`}
        />
        <button type="button" onClick={() => useGame.getState().advance()} className="btn btn-primary self-start">
          {next}
        </button>
      </div>
    </section>
  );
}
