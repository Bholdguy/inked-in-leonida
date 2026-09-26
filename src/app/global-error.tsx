"use client";

import { useEffect } from "react";
import { useGame } from "@/store/game";

// Last-resort boundary: replaces the root layout, so it renders its own html/body and inline styles.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app] root error", error.digest ?? error.name);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", background: "#0B0714", color: "#F4EDE4", fontFamily: "Arial, Helvetica, sans-serif" }}>
        <main style={{ maxWidth: 720, margin: "0 auto", padding: "80px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: "0.1em", color: "#FF8A3D", margin: 0 }}>
            Something shorted out in the shop.
          </p>
          <p style={{ color: "#9C8FB0", margin: 0 }}>The lights flickered and the needle stopped. Start the shift again.</p>
          <button
            type="button"
            onClick={() => {
              useGame.getState().reset();
              reset();
            }}
            style={{ alignSelf: "flex-start", background: "#FF3E9A", color: "#0B0714", border: 0, borderRadius: 8, padding: "12px 24px", fontWeight: 700, cursor: "pointer" }}
          >
            Restart shift
          </button>
        </main>
      </body>
    </html>
  );
}
