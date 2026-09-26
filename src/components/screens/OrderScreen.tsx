"use client";

import ClientBadge from "@/components/ClientBadge";
import OrderChecklist from "@/components/OrderChecklist";
import { currentJob, useGame } from "@/store/game";

export default function OrderScreen() {
  const job = useGame(currentJob);
  const goTo = useGame((s) => s.goTo);
  // Cover-up: the client walks back in wearing your night-1 work.
  const oldWork = useGame((s) => (job.startFrom === "tino-1" ? s.results["tino-1"]?.composite : undefined));

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
      <div className="panel flex flex-col gap-6 p-6 sm:p-8">
        <p className="eyebrow">
          {job.startFrom === "tino-1" ? "Returning client" : "New walk-in"} · Night {job.night}
        </p>

        <header className="flex items-center gap-5">
          <ClientBadge client={job.client} size={84} />
          <div className="min-w-0">
            <h2 className="font-flash text-4xl leading-none sm:text-5xl" style={{ color: job.client.accent }}>
              {job.client.name}
            </h2>
            <p className="mt-1 text-sm text-muted">{job.client.handle}</p>
            <p className="mt-2 text-sm">{job.client.bio}</p>
          </div>
        </header>

        <blockquote
          className="relative rounded-xl bg-night/50 px-5 py-4 font-display text-xl leading-snug sm:text-2xl"
          style={{ boxShadow: `inset 4px 0 0 ${job.client.accent}` }}
        >
          “{job.request}”
        </blockquote>

        {oldWork && (
          <figure className="flex items-center gap-4 rounded-xl border border-white/10 bg-night/60 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL composite */}
            <img src={oldWork} alt="The CRYSTAL tattoo you did on night 1" className="aspect-[4/5] w-24 rounded-lg object-cover" />
            <figcaption className="text-sm text-muted">
              Your work from night 1. <span className="text-ink">It&apos;s still on his arm.</span>
            </figcaption>
          </figure>
        )}
      </div>

      {/* The work ticket: paper, pinned to the counter. */}
      <div className="relative rotate-[0.6deg] rounded-lg bg-paper p-6 text-night shadow-[0_24px_50px_-20px_rgba(0,0,0,0.9)]">
        <span aria-hidden className="absolute -top-2 left-1/2 size-4 -translate-x-1/2 rounded-full bg-pink shadow-[0_0_12px_var(--pink)]" />
        <h3 className="font-flash mb-4 border-b-2 border-dashed border-night/25 pb-2 text-3xl">The order</h3>
        <OrderChecklist job={job} tone="paper" />
        <button type="button" onClick={() => goTo("STUDIO")} className="btn btn-primary mt-6 w-full">
          Start the stencil
        </button>
      </div>
    </section>
  );
}
