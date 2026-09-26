"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ImageEditor,
  type ImageEditorInstance,
  type ImageEditorRef,
} from "@unlayer/react-image-editor";
import { editorOptions } from "@/lib/editorConfig";
import { stencilHasInk } from "@/lib/ink/analyze";
import type { Job } from "@/types";

interface Props {
  job: Job;
  startImage: string; // data URL
  onTransfer: (dataUrl: string) => void;
}

const EMPTY_STENCIL = "Empty stencil. The client is staring at you.";
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

  const refuseEmpty = () => {
    setShaking(true);
    setToast(EMPTY_STENCIL);
  };

  // Both paths end here. Paper with no ink on it (e.g. only a filter applied) is still empty.
  const handOver = async (dataUrl: string) => {
    let inked = true;
    try {
      inked = await stencilHasInk(dataUrl);
    } catch (err) {
      console.error("[InkEditor] could not read the stencil, letting it through", err);
    }
    if (inked) onTransfer(dataUrl);
    else refuseEmpty();
  };

  // Our button: PRD hasChanges() guard, then getImage(). getImage() does not commit an
  // unapplied crop, so the hint asks players to close tool panels first.
  const transfer = () => {
    const ed = editor();
    if (!ed || !ed.hasChanges()) return refuseEmpty();
    const dataUrl = ed.getImage();
    if (!dataUrl) return refuseEmpty();
    void handOver(dataUrl);
  };

  const retryLoad = async () => {
    setJammed(false);
    try {
      await editor()?.reset(startImage);
    } catch (err) {
      console.error("[InkEditor] reset failed", err);
      setJammed(true);
    }
  };

  if (fatal) {
    return (
      <div role="alert" className="flex min-h-[640px] flex-col items-center justify-center gap-4 rounded-xl border border-sunset/40 bg-panel p-8 text-center">
        <p className="text-3xl font-bold tracking-widest text-sunset">POWER&apos;S OUT AT THE SHOP</p>
        <p className="max-w-sm text-muted">The stencil machine won&apos;t start. Check your connection, then flip the breaker.</p>
        <button
          type="button"
          onClick={() => {
            setFatal(false);
            setLoaded(false);
            setAttempt((a) => a + 1);
          }}
          className="rounded-lg bg-sunset px-5 py-2 font-bold text-night hover:brightness-110"
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
          className={`rounded-lg bg-pink px-5 py-2 font-bold text-night transition hover:brightness-110 disabled:cursor-wait disabled:opacity-50 disabled:hover:brightness-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${shaking ? "shake" : ""}`}
        >
          Transfer stencil
        </button>
        <p className="text-xs text-muted">Close the tool panel, then Transfer. The editor&apos;s Save works too.</p>
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
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-sunset/40 bg-sunset/10 px-4 py-2 text-sm text-sunset">
          <span>Stencil paper jammed.</span>
          <button type="button" onClick={retryLoad} className="rounded bg-sunset px-3 py-1 font-bold text-night">
            Retry
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
