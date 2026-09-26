"use client";

import { useCallback, useEffect, useState } from "react";
import PlacementStage from "@/components/placement/PlacementStage";
import { bodySrc } from "@/data/bodies";
import { zoneLabel } from "@/data/jobs";
import { makeTattooLayer } from "@/lib/ink/composite";
import { decodeImage, loadImage } from "@/lib/ink/dom";
import { currentJob, useGame } from "@/store/game";
import type { Job, Placement } from "@/types";

// The cover-up starts exactly where the old ink sits (same stencil size, same transform).
function defaultPlacement(job: Job, previous: Placement | undefined): Placement {
  if (job.startFrom === "tino-1" && previous) return { ...previous };
  const z = job.targetZone;
  return z ? { cx: z.x + z.w / 2, cy: z.y + z.h / 2, scale: 1, rotate: 0 } : { cx: 0.5, cy: 0.5, scale: 1, rotate: 0 };
}

export default function PlacementScreen({ onLock }: { onLock: (placement: Placement) => void | Promise<void> }) {
  const job = useGame(currentJob);
  const stencil = useGame((s) => s.draft.stencil);
  const saved = useGame((s) => s.draft.placement);
  const previous = useGame((s) => s.results["tino-1"]?.placement);
  const [placement, setPlacement] = useState<Placement>(() => saved ?? defaultPlacement(job, previous));
  const [assets, setAssets] = useState<{ body: HTMLImageElement; tattoo: HTMLCanvasElement } | null>(null);
  const [failed, setFailed] = useState(false);
  const [locking, setLocking] = useState(false);

  const load = useCallback(async () => {
    if (!stencil) return;
    setFailed(false);
    try {
      const [body, raw] = await Promise.all([loadImage(bodySrc(job.body.zone, job.body.tone)), decodeImage(stencil)]);
      setAssets({ body, tattoo: makeTattooLayer(raw) });
    } catch (err) {
      console.error("[Placement] could not load the body or the stencil", err);
      setFailed(true);
    }
  }, [job.body.zone, job.body.tone, stencil]);

  useEffect(() => {
    void load();
  }, [load]);

  if (failed || !stencil) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-sunset/40 bg-panel p-6">
        <p className="font-bold text-sunset">The client flinched and the stencil smudged.</p>
        <button type="button" onClick={load} className="rounded bg-sunset px-4 py-2 font-bold text-night">
          Retry
        </button>
      </div>
    );
  }
  if (!assets) return <p className="text-muted">Prepping the skin…</p>;

  const update = (patch: Partial<Placement>) => setPlacement((p) => ({ ...p, ...patch }));

  return (
    <section className="grid gap-6 md:grid-cols-[minmax(0,480px)_1fr] md:items-start">
      <PlacementStage
        body={assets.body}
        tattoo={assets.tattoo}
        placement={placement}
        onMove={(cx, cy) => update({ cx, cy })}
        zone={job.targetZone}
        zoneLabel={zoneLabel(job)}
      />

      <div className="flex flex-col gap-5 rounded-xl border border-white/10 bg-panel p-5">
        <div>
          <h2 className="text-xl font-bold">Place it</h2>
          <p className="text-sm text-muted">
            Drag the ink anywhere on the {job.body.zone}. Arrow keys nudge it, Shift + arrows move it further.
          </p>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="flex justify-between">
            Size <span className="text-muted">{placement.scale.toFixed(2)}x</span>
          </span>
          <input
            type="range"
            min={0.2}
            max={1.5}
            step={0.01}
            value={placement.scale}
            onChange={(e) => update({ scale: Number(e.target.value) })}
            className="accent-pink"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="flex justify-between">
            Rotate <span className="text-muted">{Math.round(placement.rotate)}°</span>
          </span>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={placement.rotate}
            onChange={(e) => update({ rotate: Number(e.target.value) })}
            className="accent-pink"
          />
        </label>

        <button
          type="button"
          disabled={locking}
          onClick={async () => {
            setLocking(true);
            try {
              await onLock(placement);
            } finally {
              setLocking(false);
            }
          }}
          className="self-start rounded-lg bg-pink px-6 py-3 font-bold text-night transition hover:brightness-110 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          {locking ? "Inking…" : "Lock it in"}
        </button>
      </div>
    </section>
  );
}
