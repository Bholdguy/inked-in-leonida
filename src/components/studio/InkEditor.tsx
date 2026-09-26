"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ImageEditor,
  type ImageEditorInstance,
  type ImageEditorRef,
} from "@unlayer/react-image-editor";
import { editorOptions } from "@/lib/editorConfig";
import { useGame } from "@/store/game";
import { stencilHasInk, stencilUntouched } from "@/lib/ink/analyze";
import type { Job } from "@/types";

interface Props {
  job: Job;
  startImage: string; // data URL
  onTransfer: (dataUrl: string) => void;
}

const EMPTY_STENCIL = "Empty stencil. The client is staring at you.";
const UNTOUCHED_COVERUP = "That still says CRYSTAL. Paint over it first.";
export const LOAD_TIMEOUT_MS = 15_000; // no onLoad by then -> treat as a dead CDN
// The package default. A hung load stays cached per URL inside the package loader, so a retry
// after a timeout asks for a fresh URL; harmless once window.ImageEditor exists (it short-circuits).
const EMBED_URL = "https://cdn.unlayer.com/image-editor/embed.js";

export default function InkEditor({ job, startImage, onTransfer }: Props) {
  const editorRef = useRef<ImageEditorRef>(null);
  const instanceRef = useRef<ImageEditorInstance | null>(null);
  const [attempt, setAttempt] = useState(0); // bumped by "Retry" after a fatal error to remount
  const [fatal, setFatal] = useState(false);
  const [loaded, setLoaded] = useState(false); // onLoad fired for the current attempt
  const [jammed, setJammed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const options = useMemo(() => editorOptions(job.id), [job.id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Each mount attempt gets 15 s to fire onLoad before the shop "loses power".
  useEffect(() => {
    if (fatal || loaded) return;
    const t = setTimeout(() => {
      console.error(`[InkEditor] editor did not load within ${LOAD_TIMEOUT_MS} ms`);
      setFatal(true);
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [attempt, fatal, loaded]);

  const editor = () => editorRef.current?.editor ?? instanceRef.current;

  const refuse = (message: string) => {
    setShaking(true);
    setToast(message);
  };
  const refuseEmpty = () => refuse(EMPTY_STENCIL);

  // Both paths end here. Paper with no ink on it (e.g. only a filter applied) is still empty, and
  // a cover-up handed back untouched is refused too (the old stencil already has ink on it).
  const handOver = async (dataUrl: string) => {
    let inked = true;
    let untouched = false;
    try {
      inked = await stencilHasInk(dataUrl);
      if (inked && job.startFrom === "tino-1") untouched = await stencilUntouched(startImage, dataUrl);
    } catch (err) {
      console.error("[InkEditor] could not read the stencil, letting it through", err);
    }
    if (!inked) refuseEmpty();
    else if (untouched) refuse(UNTOUCHED_COVERUP);
    else onTransfer(dataUrl);
  };

  // Our button: PRD hasChanges() guard, then getImage(). getImage() does not commit an
  // unapplied crop, so the hint asks players to close tool panels first.
  const transfer = () => {
    const ed = editor();
    // An untouched cover-up still has the old ink on it: say so instead of "empty".
    if (!ed || !ed.hasChanges()) return job.startFrom === "tino-1" ? refuse(UNTOUCHED_COVERUP) : refuseEmpty();
    const dataUrl = ed.getImage();
    if (!dataUrl) return refuseEmpty();
    void handOver(dataUrl);
  };

  // "Stencil paper jammed" Retry: reload the image in place, or remount the editor when there is
  // no instance to reset (or the reset itself fails).
  const remount = () => {
    setLoaded(false);
    setAttempt((a) => a + 1);
  };
  const retryLoad = async () => {
    setJammed(false);
    const ed = editor();
    if (!ed) return remount();
    try {
      await ed.reset(startImage);
    } catch (err) {
      console.error("[InkEditor] reset failed, remounting", err);
      remount();
    }
  };

  if (fatal) {
    return (
      <div role="alert" className="panel flex min-h-[640px] flex-col items-center justify-center gap-5 border-sunset/40 bg-[radial-gradient(ellipse_at_center,rgba(255,138,61,0.12),transparent_65%)] p-8 text-center">
        <p className="eyebrow text-sunset">The stencil machine is dark</p>
        <p className="neon neon-flicker text-4xl tracking-[0.12em] [text-shadow:0_0_2px_#fff,0_0_10px_var(--sunset),0_0_26px_var(--sunset)] sm:text-5xl">
          POWER&apos;S OUT AT THE SHOP
        </p>
        <p className="max-w-sm text-muted">The editor couldn&apos;t load from its CDN. Check your connection, then flip the breaker.</p>
        <button
          type="button"
          onClick={() => {
            setFatal(false);
            remount();
          }}
          className="btn btn-warn"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={transfer}
          disabled={!loaded}
          onAnimationEnd={() => setShaking(false)}
          className={`btn btn-primary ${shaking ? "shake" : ""}`}
        >
          Transfer stencil
        </button>
        <p className="text-xs text-muted">Close the tool panel, then Transfer. The editor&apos;s own Transfer Stencil button works too.</p>
      </div>

      {!loaded && (
        <p role="status" className="text-sm text-muted">
          Setting up the stencil paper...
        </p>
      )}

      {toast && (
        <p role="status" className="rounded-lg border border-pink/40 bg-pink/10 px-4 py-2 text-sm text-pink">
          {toast}
        </p>
      )}

      {jammed && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-sunset/40 bg-sunset/10 px-4 py-2 text-sm text-sunset">
          <span>Stencil paper jammed.</span>
          <button type="button" onClick={retryLoad} className="btn btn-warn btn-sm">
            Retry
          </button>
          {/* A start image that never loads would loop on Retry: always leave a way out. */}
          <button type="button" onClick={() => useGame.getState().reset()} className="btn btn-ghost btn-sm">
            Restart shift
          </button>
        </div>
      )}

      <ImageEditor
        key={attempt}
        ref={editorRef}
        scriptUrl={attempt > 0 ? `${EMBED_URL}?retry=${attempt}` : undefined}
        image={startImage}
        options={options}
        minHeight={640}
        onLoad={(instance) => {
          instanceRef.current = instance;
          // Dev-only debugging handle (removed from production builds), like the store's __game.
          if (process.env.NODE_ENV === "development") (window as unknown as { __editor?: ImageEditorInstance }).__editor = instance;
          setLoaded(true);
        }}
        // hasChanges() reads false inside onSave (CDN 2.12.0), so Save is guarded by the ink check only.
        onSave={({ dataUrl }) => void handOver(dataUrl)}
        onLoadError={() => {
          console.error("[InkEditor] onLoadError: the stencil image failed to load into the editor");
          setJammed(true);
        }}
        onError={(err) => {
          console.error("[InkEditor] onError:", err);
          setFatal(true);
        }}
      />
    </div>
  );
}
