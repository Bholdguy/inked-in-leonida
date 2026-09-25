"use client";

import OrderScreen from "@/components/screens/OrderScreen";
import { useGame } from "@/store/game";

export default function GameShell() {
  const screen = useGame((s) => s.screen);

  switch (screen) {
    case "ORDER":
      return <OrderScreen />;
    default:
      return <p className="text-muted">Screen {screen} is not built yet.</p>;
  }
}
