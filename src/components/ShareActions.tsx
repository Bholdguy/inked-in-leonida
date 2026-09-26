"use client";

import { useState } from "react";
import { downloadBlob, renderShareCard, type CardInput } from "@/lib/share/card";
import { shareText, xIntentUrl } from "@/lib/share/social";

interface Props extends CardInput {
  client: string | null; // null for the finale
  filename: string;
}

const LIVE_URL = "https://inked-in-leonida.vercel.app";

export default function ShareActions({ client, filename, ...card }: Props) {
  const [state, setState] = useState<"idle" | "printing" | "failed">("idle");
  const [url, setUrl] = useState(LIVE_URL);

  const download = async () => {
    setState("printing");
    try {
      downloadBlob(await renderShareCard(card), filename);
      setState("idle");
    } catch (err) {
      console.error("[Share] could not print the card", err instanceof Error ? err.name : err);
      setState("failed");
    }
  };

  // The live origin, read in the browser (the server render has no window).
  const syncUrl = () => setUrl(window.location.origin);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={download} disabled={state === "printing"} className="btn btn-ghost">
          <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v3h16v-3" />
          </svg>
          {state === "printing" ? "Printing…" : "Download card"}
        </button>
        <a
          href={xIntentUrl(shareText(client, card.stars, url))}
          target="_blank"
          rel="noopener noreferrer"
          onPointerDown={syncUrl}
          onFocus={syncUrl}
          className="btn btn-ghost"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="currentColor">
            <path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" />
          </svg>
          Share on X
        </a>
      </div>
      {state === "failed" ? (
        <p role="alert" className="text-sm text-sunset">
          The card printer jammed. Hit Download card again.
        </p>
      ) : (
        <p className="text-xs text-muted">Attach your downloaded card to the post.</p>
      )}
    </div>
  );
}
