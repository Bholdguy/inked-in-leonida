"use client";

import { unlockAudio } from "@/lib/audio";
import { saveSound } from "@/lib/game/prefs";
import { useGame } from "@/store/game";

export default function SoundToggle({ className = "" }: { className?: string }) {
  const sound = useGame((s) => s.sound);
  const toggle = () => {
    const on = !useGame.getState().sound;
    if (on) unlockAudio(); // inside the click: browsers only allow audio after a gesture
    useGame.getState().setSound(on);
    saveSound(on);
  };
  return (
    <button type="button" onClick={toggle} aria-pressed={sound} className={`btn btn-ghost btn-sm ${className}`}>
      <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5 6 9H3v6h3l5 4V5z" />
        {sound ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="m16 9 5 6M21 9l-5 6" />}
      </svg>
      Sound {sound ? "on" : "off"}
    </button>
  );
}
