"use client";

import { useState } from "react";

// PRD 6: under 768 px, suggest desktop. Pure CSS visibility, never blocks play; dismissible.
export default function DesktopBanner() {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div role="note" className="flex items-center gap-3 rounded-xl border border-teal/30 bg-teal/10 px-3 py-2 text-sm text-teal md:hidden">
      <span aria-hidden>🖥️</span>
      <p className="flex-1">Best on desktop: the stencil editor wants a mouse and a big screen. You can still play here.</p>
      <button type="button" onClick={() => setHidden(true)} aria-label="Dismiss" className="btn btn-ghost btn-sm px-2 py-1">
        ✕
      </button>
    </div>
  );
}
