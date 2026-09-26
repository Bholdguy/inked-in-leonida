"use client";

import { useEffect, useState } from "react";
import PlacementScreen from "@/components/placement/PlacementScreen";
import InkingScreen from "@/components/screens/InkingScreen";
import OrderScreen from "@/components/screens/OrderScreen";
import VerdictScreen from "@/components/screens/VerdictScreen";
import StudioScreen from "@/components/studio/StudioScreen";
import FinaleIntroScreen from "@/components/screens/FinaleIntroScreen";
import NightIntroScreen from "@/components/screens/NightIntroScreen";
import SelfRevealScreen from "@/components/screens/SelfRevealScreen";
import SelfSetupScreen from "@/components/screens/SelfSetupScreen";
import TitleScreen from "@/components/screens/TitleScreen";
import { prepareJob } from "@/lib/game/evaluate";
import { currentJob, useGame, type Screen } from "@/store/game";
import type { Placement } from "@/types";

// Per-job steps: ORDER -> STUDIO -> PLACEMENT -> INKING (judge) -> VERDICT. The shift around
// them (TITLE, NIGHT_INTRO, finale, SHOP_WALL) is driven by the store's advance().
const JOB_STEPS: { screen: Screen; label: string }[] = [
  { screen: "ORDER", label: "Order" },
  { screen: "STUDIO", label: "Stencil" },
  { screen: "PLACEMENT", label: "Placement" },
  { screen: "INKING", label: "Inking" },
  { screen: "VERDICT", label: "Verdict" },
];
const SELF_STEPS: { screen: Screen; label: string }[] = [
  { screen: "SELF_SETUP", label: "Your chair" },
  { screen: "STUDIO", label: "Stencil" },
  { screen: "PLACEMENT", label: "Placement" },
  { screen: "INKING", label: "Inking" },
  { screen: "SELF_REVEAL", label: "Reveal" },
];

export default function GameShell() {
  const screen = useGame((s) => s.screen);
  const job = useGame(currentJob);
  const [lockError, setLockError] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);

  const lockIn = async (placement: Placement) => {
    const { draft, results, setPlacement, startInking, goTo } = useGame.getState();
    if (!draft.stencil) return goTo("STUDIO");
    setPlacement(placement);
    setLockError(false);
    try {
      const prepared = await prepareJob({
        job,
        stencil: draft.stencil,
        placement,
        previousStencil: results["tino-1"]?.stencil,
      });
      startInking(prepared);
    } catch (err) {
      console.error("[GameShell] could not finish the tattoo", err);
      setLockError(true);
    }
  };

  const restart = () => useGame.getState().reset();
  const STEPS = job.mode === "free" ? SELF_STEPS : JOB_STEPS;
  const stepIndex = STEPS.findIndex((s) => s.screen === screen);

  let body: React.ReactNode;
  switch (screen) {
    case "TITLE":
      body = <TitleScreen />;
      break;
    case "NIGHT_INTRO":
      body = <NightIntroScreen />;
      break;
    case "ORDER":
      body = <OrderScreen />;
      break;
    case "STUDIO":
      body = <StudioScreen />;
      break;
    case "PLACEMENT":
      body = (
        <div className="flex flex-col gap-4">
          {lockError && (
            <p role="alert" className="rounded-lg border border-sunset/40 bg-sunset/10 px-4 py-2 text-sm text-sunset">
              The needle skipped. Hit &quot;Lock it in&quot; again.
            </p>
          )}
          <PlacementScreen onLock={lockIn} />
        </div>
      );
      break;
    case "INKING":
      body = <InkingScreen />;
      break;
    case "VERDICT":
      body = <VerdictScreen />;
      break;
    case "FINALE_INTRO":
      body = <FinaleIntroScreen />;
      break;
    case "SELF_SETUP":
      body = <SelfSetupScreen />;
      break;
    case "SELF_REVEAL":
      body = <SelfRevealScreen />;
      break;
    default:
      // Any screen without a view must still leave the player a way back.
      body = (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-white/10 bg-panel p-6">
          <p className="font-bold">This part of the shop is still under renovation.</p>
          <button type="button" onClick={restart} className="rounded bg-pink px-4 py-2 font-bold text-night">
            Back to the first client
          </button>
        </div>
      );
  }

  return (
    <div className="flex flex-col gap-6">
      {stepIndex >= 0 && (
        <nav aria-label="Job progress" className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
          {STEPS.map((s, i) => (
            <span key={s.screen} className="flex items-center gap-2">
              <span
                aria-current={i === stepIndex ? "step" : undefined}
                className={i === stepIndex ? "text-pink" : i < stepIndex ? "text-ink" : "text-muted/60"}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && <span className="text-muted/40">/</span>}
            </span>
          ))}
        </nav>
      )}
      {body}
    </div>
  );
}
