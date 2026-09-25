"use client";

import PlacementScreen from "@/components/placement/PlacementScreen";
import OrderScreen from "@/components/screens/OrderScreen";
import StudioScreen from "@/components/studio/StudioScreen";
import { useGame } from "@/store/game";

export default function GameShell() {
  const screen = useGame((s) => s.screen);
  const setPlacement = useGame((s) => s.setPlacement);
  const goTo = useGame((s) => s.goTo);

  switch (screen) {
    case "ORDER":
      return <OrderScreen />;
    case "STUDIO":
      return <StudioScreen />;
    case "PLACEMENT":
      return (
        <PlacementScreen
          onLock={(placement) => {
            setPlacement(placement);
            goTo("VERDICT");
          }}
        />
      );
    default:
      return <p className="text-muted">Screen {screen} is not built yet.</p>;
  }
}
