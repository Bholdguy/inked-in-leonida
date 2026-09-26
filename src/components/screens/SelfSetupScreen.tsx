"use client";

import { bodySrc, SKIN_HEX } from "@/data/bodies";
import { useGame, type SelfBody } from "@/store/game";
import type { SkinTone } from "@/types";

const ZONES: { id: SelfBody["zone"]; label: string }[] = [
  { id: "forearm", label: "Forearm" },
  { id: "back", label: "Back" },
];
const TONES: { id: SkinTone; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "medium", label: "Medium" },
  { id: "deep", label: "Deep" },
];

const chip = (on: boolean) =>
  `rounded-lg border-2 px-4 py-2 font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${
    on ? "border-pink bg-pink/15 text-ink" : "border-white/15 text-muted hover:border-white/40"
  }`;

export default function SelfSetupScreen() {
  const body = useGame((s) => s.selfBody);
  // Read the latest body at click time so two quick picks never undo each other.
  const pick = (patch: Partial<SelfBody>) => {
    const { selfBody, setSelfBody } = useGame.getState();
    setSelfBody({ ...selfBody, ...patch });
  };

  return (
    <section className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr] md:items-start">
      {/* eslint-disable-next-line @next/next/no-img-element -- static body art */}
      <img
        src={bodySrc(body.zone, body.tone)}
        alt={`Your ${body.zone}, ${body.tone} skin`}
        className="aspect-[4/5] w-full max-w-[320px] rounded-xl border border-white/10 bg-[radial-gradient(circle_at_50%_30%,#241838,var(--night))]"
      />
      <div className="flex flex-col gap-6 panel p-6">
        <h2 className="text-2xl font-bold">Your chair</h2>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-xs uppercase tracking-[0.3em] text-muted">Where</legend>
          <div className="flex flex-wrap gap-2">
            {ZONES.map((z) => (
              <button key={z.id} type="button" aria-pressed={body.zone === z.id} onClick={() => pick({ zone: z.id })} className={chip(body.zone === z.id)}>
                {z.label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-xs uppercase tracking-[0.3em] text-muted">Skin tone</legend>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button key={t.id} type="button" aria-pressed={body.tone === t.id} onClick={() => pick({ tone: t.id })} className={chip(body.tone === t.id)}>
                <span className="mr-2 inline-block size-3 rounded-full align-middle" style={{ background: SKIN_HEX[t.id] }} />
                {t.label}
              </button>
            ))}
          </div>
        </fieldset>
        <button
          type="button"
          onClick={() => useGame.getState().goTo("STUDIO")}
          className="btn btn-primary self-start"
        >
          Start the stencil
        </button>
      </div>
    </section>
  );
}
