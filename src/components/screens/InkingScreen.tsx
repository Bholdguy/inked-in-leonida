"use client";

import { useEffect, useRef, useState } from "react";
import { bodySrc } from "@/data/bodies";
import { finishFree, safeFinish } from "@/lib/game/evaluate";
import { requestJudgement } from "@/lib/game/judgeClient";
import { useGame } from "@/store/game";

// PRD 8.2: a 2.5 s reveal sweep with the needle leading the edge, then a 1 s fresh-ink halo.
// The judge runs in parallel (9 s cap in judgeClient). Reduced motion: the result, instantly.
export const SWEEP_MS = 2500;
export const HALO_MS = 1000;
const MIN_SHOW_REDUCED_MS = 1200; // so a fast fallback doesn't flash past

type Phase = "sweep" | "halo" | "done";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

export default function InkingScreen() {
  const inking = useGame((s) => s.inking);
  const oldWork = useGame((s) => s.results["tino-1"]?.composite);
  const started = useRef(false); // survives the Strict Mode double effect
  const [failed, setFailed] = useState(false);
  const [reduced] = useState(prefersReducedMotion);
  const [phase, setPhase] = useState<Phase>(() => (prefersReducedMotion() ? "done" : "sweep"));
  const inkRef = useRef<HTMLImageElement>(null);
  const needleRef = useRef<HTMLSpanElement>(null);

  // The judge, in parallel with the animation. The verdict waits for the animation to finish.
  useEffect(() => {
    if (!inking || started.current) return;
    started.current = true;
    const t0 = performance.now();
    const minShow = reduced ? MIN_SHOW_REDUCED_MS : SWEEP_MS + HALO_MS;
    const free = inking.job.mode === "free"; // the finale is never judged
    void (async () => {
      const verdict = free ? null : await requestJudgement(inking.job.id, inking.compositeJpegB64, inking.stencilJpegB64);
      const wait = minShow - (performance.now() - t0);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      const result = verdict ? safeFinish(inking, verdict) : finishFree(inking);
      if (result) useGame.getState().finishInking(inking.job.id, result);
      else setFailed(true);
    })();
  }, [inking, reduced]);

  // The sweep: clip the finished ink open left to right across its bounding box.
  useEffect(() => {
    if (!inking || phase !== "sweep") return;
    const box = inking.inkBox ?? { x: 0, y: 0, w: 1, h: 1 };
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / SWEEP_MS);
      const edge = box.x + box.w * t;
      if (inkRef.current) inkRef.current.style.clipPath = `inset(0 ${(1 - edge) * 100}% 0 0)`;
      if (needleRef.current) {
        // The needle zigzags up and down the stroke as it moves across.
        const y = box.y + box.h * (0.5 + 0.46 * Math.sin(now / 35));
        needleRef.current.style.left = `${edge * 100}%`;
        needleRef.current.style.top = `${y * 100}%`;
      }
      if (t < 1) frame = requestAnimationFrame(tick);
      else setPhase("halo");
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inking, phase]);

  useEffect(() => {
    if (phase !== "halo") return;
    const t = setTimeout(() => setPhase("done"), HALO_MS);
    return () => clearTimeout(t);
  }, [phase]);

  if (!inking || failed) {
    return (
      <div role="alert" className="panel flex flex-col items-start gap-3 p-6">
        <p className="font-bold">{failed ? "The needle jammed mid-line." : "The needle has nothing to ink."}</p>
        <button type="button" onClick={() => useGame.getState().goTo("PLACEMENT")} className="btn btn-primary btn-sm">
          Back to placement
        </button>
      </div>
    );
  }

  // Before the needle: bare skin, or, for the cover-up, the old CRYSTAL tattoo.
  const before = inking.job.startFrom === "tino-1" && oldWork ? oldWork : bodySrc(inking.job.body.zone, inking.job.body.tone);
  const who = inking.job.mode === "free" ? "your" : `${inking.job.client.name}'s`;

  return (
    <section className="grid gap-6 md:grid-cols-[minmax(0,460px)_1fr] md:items-center">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_30%,#241838,var(--night))]">
        {/* eslint-disable-next-line @next/next/no-img-element -- static body art or data URL */}
        <img src={before} alt="" className="absolute inset-0 h-full w-full" />
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL composite */}
        <img
          ref={inkRef}
          src={inking.composite}
          alt={`The tattoo going onto ${who} ${inking.job.body.zone}`}
          className="absolute inset-0 h-full w-full"
          style={phase === "sweep" ? { clipPath: "inset(0 100% 0 0)" } : undefined}
        />
        {phase === "halo" && (
          // eslint-disable-next-line @next/next/no-img-element -- data URL halo layer
          <img src={inking.halo} alt="" aria-hidden className="fresh-halo pointer-events-none absolute inset-0 h-full w-full" />
        )}
        {phase === "sweep" && <span ref={needleRef} aria-hidden className="needle" />}
      </div>
      <div role="status" aria-live="polite" className="flex flex-col gap-2">
        <p className="eyebrow">{phase === "done" ? "Wiping it down" : "Needle down"}</p>
        <p className="font-display text-3xl font-bold sm:text-4xl">
          {phase === "done" ? "Fresh ink. Let it breathe…" : "The needle's working…"}
        </p>
        <p className="text-muted">
          {inking.job.mode === "free" ? "Steady hand. It's your own skin." : `${inking.job.client.name} is watching every line.`}
        </p>
      </div>
    </section>
  );
}
