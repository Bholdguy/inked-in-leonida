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
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-2xl border border-white/10 bg-panel p-6 sm:p-8">
      <p className="text-xs uppercase tracking-[0.3em] text-muted">
        {job.startFrom === "tino-1" ? "Returning client" : "New walk-in"} · Night {job.night}
      </p>

      <header className="flex items-center gap-4">
        <ClientBadge client={job.client} />
        <div>
          <h2 className="text-2xl font-bold">{job.client.name}</h2>
          <p className="text-sm text-muted">{job.client.handle}</p>
          <p className="mt-1 text-sm">{job.client.bio}</p>
        </div>
      </header>

      <blockquote className="border-l-4 pl-4 text-lg italic" style={{ borderColor: job.client.accent }}>
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

      <div className="rounded-xl border border-white/10 bg-night/60 p-4">
        <h3 className="mb-3 text-xs uppercase tracking-[0.3em] text-muted">The order</h3>
        <OrderChecklist job={job} />
      </div>

      <button
        type="button"
        onClick={() => goTo("STUDIO")}
        className="self-start rounded-lg bg-pink px-6 py-3 font-bold text-night transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
      >
        Start the stencil
      </button>
    </section>
  );
}
