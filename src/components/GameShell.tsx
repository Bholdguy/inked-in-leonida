"use client";

import { useState } from "react";
import PlacementScreen from "@/components/placement/PlacementScreen";
import OrderScreen from "@/components/screens/OrderScreen";
import VerdictScreen from "@/components/screens/VerdictScreen";
import StudioScreen from "@/components/studio/StudioScreen";
import { evaluateJob } from "@/lib/game/evaluate";
import { currentJob, useGame } from "@/store/game";
import type { Placement } from "@/types";

export default function GameShell() {
  const screen = useGame((s) => s.screen);
  const job = useGame(currentJob);
  const [lockError, setLockError] = useState(false);

  const lockIn = async (placement: Placement) => {
    const { draft, results, setPlacement, saveResult, goTo } = useGame.getState();
    if (!draft.stencil) return goTo("STUDIO");
    setPlacement(placement);
    setLockError(false);
    try {
      const { result } = await evaluateJob({
        job,
        stencil: draft.stencil,
        placement,
        previousStencil: results["tino-1"]?.stencil,
      });
      saveResult(job.id, result);
      goTo("VERDICT");
    } catch (err) {
      console.error("[GameShell] could not finish the tattoo", err);
      setLockError(true);
    }
  };

  switch (screen) {
    case "ORDER":
      return <OrderScreen />;
    case "STUDIO":
      return <StudioScreen />;
    case "PLACEMENT":
      return (
        <div className="flex flex-col gap-4">
          {lockError && (
            <p role="alert" className="rounded-lg border border-sunset/40 bg-sunset/10 px-4 py-2 text-sm text-sunset">
              The needle skipped. Hit &quot;Lock it in&quot; again.
            </p>
          )}
          <PlacementScreen onLock={lockIn} />
        </div>
      );
    case "VERDICT":
      // Phase 1 ends at Tino's verdict; INKGRAM and the next client arrive in later phases.
      return <VerdictScreen onDone={() => useGame.getState().reset()} />;
    default:
      return <p className="text-muted">Screen {screen} is not built yet.</p>;
  }
}
