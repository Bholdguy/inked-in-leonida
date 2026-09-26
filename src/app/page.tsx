import GameShell from "@/components/GameShell";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:py-10">
      <GameShell />
      <footer className="mt-auto border-t border-white/10 pt-4 text-xs text-muted">
        Your drawings are sent to Google&apos;s Gemini AI for judging. We don&apos;t store them.
      </footer>
    </main>
  );
}
