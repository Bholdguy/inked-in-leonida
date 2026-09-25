"use client";

import ClientBadge from "@/components/ClientBadge";
import OrderChecklist from "@/components/OrderChecklist";
import { currentJob, useGame } from "@/store/game";

export default function OrderScreen() {
  const job = useGame(currentJob);
  const goTo = useGame((s) => s.goTo);

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-2xl border border-white/10 bg-panel p-6 sm:p-8">
      <p className="text-xs uppercase tracking-[0.3em] text-muted">New walk-in · Night {job.night}</p>

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
