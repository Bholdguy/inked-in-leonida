"use client";

import { useCallback, useEffect, useState } from "react";
import ClientBadge from "@/components/ClientBadge";
import OrderChecklist from "@/components/OrderChecklist";
import InkEditor from "@/components/studio/InkEditor";
import { urlToDataUrl } from "@/lib/ink/dom";
import { currentJob, useGame } from "@/store/game";

const BLANK_STENCIL = "/stencils/blank.png";

export default function StudioScreen() {
  const job = useGame(currentJob);
  const results = useGame((s) => s.results);
  const setStencil = useGame((s) => s.setStencil);
  const goTo = useGame((s) => s.goTo);
  const [startImage, setStartImage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  // PRD 10.4: blank paper as a data URL, or the raw tino-1 stencil for the cover-up.
  const prepare = useCallback(async () => {
    setFailed(false);
    const previous = job.startFrom === "tino-1" ? results["tino-1"]?.stencil : null;
    if (previous) return setStartImage(previous);
    try {
      setStartImage(await urlToDataUrl(BLANK_STENCIL));
    } catch (err) {
      console.error("[Studio] could not load the blank stencil", err);
      setFailed(true);
    }
  }, [job.startFrom, results]);

  useEffect(() => {
    void prepare();
  }, [prepare]);

  const checklist = (
    <>
      <div className="mb-4 flex items-center gap-3">
        <ClientBadge client={job.client} size={44} />
        <div>
          <p className="font-bold">{job.client.name}</p>
          <p className="text-xs text-muted">{job.client.handle}</p>
        </div>
      </div>
      <OrderChecklist job={job} />
    </>
  );

  return (
    <section className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-xl border border-white/10 bg-panel p-4 lg:self-start">
        <details className="lg:hidden">
          <summary className="cursor-pointer text-xs uppercase tracking-[0.3em] text-muted">The order</summary>
          <div className="mt-4">{checklist}</div>
        </details>
        <div className="hidden lg:block">
          <h3 className="mb-4 text-xs uppercase tracking-[0.3em] text-muted">The order</h3>
          {checklist}
        </div>
      </aside>

      <div className="min-w-0">
        {failed ? (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-sunset/40 bg-panel p-6">
            <p className="font-bold text-sunset">Out of stencil paper.</p>
            <button type="button" onClick={prepare} className="rounded bg-sunset px-4 py-2 font-bold text-night">
              Retry
            </button>
          </div>
        ) : startImage ? (
          <InkEditor
            key={job.id}
            job={job}
            startImage={startImage}
            onTransfer={(dataUrl) => {
              setStencil(dataUrl);
              goTo("PLACEMENT");
            }}
          />
        ) : (
          <p className="text-muted">Laying out the stencil paper…</p>
        )}
      </div>
    </section>
  );
}
