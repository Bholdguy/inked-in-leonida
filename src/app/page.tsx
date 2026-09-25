import GameShell from "@/components/GameShell";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10">
      <header>
        <h1 className="text-4xl font-bold tracking-widest">INKED IN LEONIDA</h1>
        <p className="mt-2 text-muted">Night shift on the strip.</p>
      </header>
      <GameShell />
      <footer className="mt-auto border-t border-white/10 pt-4 text-xs text-muted">
        Your drawings are sent to an AI to judge them. Nothing is stored.
      </footer>
    </main>
  );
}
