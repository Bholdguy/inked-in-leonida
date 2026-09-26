"use client";

import { useEffect, useState } from "react";
import PlacementScreen from "@/components/placement/PlacementScreen";
import InkingScreen from "@/components/screens/InkingScreen";
import OrderScreen from "@/components/screens/OrderScreen";
import VerdictScreen from "@/components/screens/VerdictScreen";
import StudioScreen from "@/components/studio/StudioScreen";
import FinaleIntroScreen from "@/components/screens/FinaleIntroScreen";
import InkgramScreen from "@/components/screens/InkgramScreen";
import NightIntroScreen from "@/components/screens/NightIntroScreen";
import SelfRevealScreen from "@/components/screens/SelfRevealScreen";
import SelfSetupScreen from "@/components/screens/SelfSetupScreen";
import ShopWallScreen from "@/components/screens/ShopWallScreen";
import TitleScreen from "@/components/screens/TitleScreen";
import ShopHeader from "@/components/ShopHeader";
import DesktopBanner from "@/components/DesktopBanner";
import { unlockAudio } from "@/lib/audio";
import { prepareJob } from "@/lib/game/evaluate";
import { loadSound } from "@/lib/game/prefs";
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
  { screen: "INKGRAM", label: "InkGram" },
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

  // Sound preference from last visit (off by default). Audio can only start after a gesture,
  // so while sound is on, the next tap anywhere wakes the AudioContext.
  const sound = useGame((s) => s.sound);
  useEffect(() => {
    if (loadSound()) useGame.getState().setSound(true);
  }, []);
  useEffect(() => {
    if (!sound) return;
    window.addEventListener("pointerdown", unlockAudio);
    return () => window.removeEventListener("pointerdown", unlockAudio);
  }, [sound]);

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
    case "INKGRAM":
      body = <InkgramScreen />;
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
    case "SHOP_WALL":
      body = <ShopWallScreen />;
      break;
    default:
      // Any screen without a view must still leave the player a way back.
      body = (
        <div role="alert" className="flex flex-col items-start gap-3 panel p-6">
          <p className="font-bold">This part of the shop is still under renovation.</p>
          <button type="button" onClick={() => useGame.getState().advance()} className="btn btn-primary btn-sm">
            Back to the shop
          </button>
        </div>
      );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <DesktopBanner />
      {screen !== "TITLE" && <ShopHeader />}
      {stepIndex >= 0 && (
        <nav aria-label="Job progress" className="flex flex-wrap items-center gap-1.5 text-[11px] uppercase tracking-[0.2em]">
          {STEPS.map((s, i) => (
            <span
              key={s.screen}
              aria-current={i === stepIndex ? "step" : undefined}
              className={`rounded-full border px-3 py-1 transition-colors motion-reduce:transition-none ${
                i === stepIndex
                  ? "border-pink bg-pink/15 text-ink shadow-[0_0_16px_-4px_var(--pink)]"
                  : i < stepIndex
                    ? "border-white/15 text-ink/80"
                    : "border-white/5 text-muted/60"
              }`}
            >
              {s.label}
            </span>
          ))}
        </nav>
      )}
      <div key={screen} className="rise-in flex flex-col">
        {body}
      </div>
    </div>
  );
}
