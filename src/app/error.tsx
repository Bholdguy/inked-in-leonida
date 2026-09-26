"use client";

import { useEffect } from "react";
import { useGame } from "@/store/game";

// Route-level error boundary: never a blank screen, always a way back into the shift.
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app] render error", error.digest ?? error.name);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-start justify-center gap-4 px-4 py-10">
      <p className="text-3xl font-bold tracking-widest text-sunset">Something shorted out in the shop.</p>
      <p className="text-muted">The lights flickered and the needle stopped. Start the shift again.</p>
      <button
        type="button"
        onClick={() => {
          useGame.getState().reset();
          reset();
        }}
        className="btn btn-primary"
      >
        Restart shift
      </button>
    </main>
  );
}
