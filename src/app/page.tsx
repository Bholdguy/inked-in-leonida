import GameShell from "@/components/GameShell";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:py-10">
      <GameShell />
      <footer className="mt-auto flex flex-col gap-2 border-t border-white/10 pt-4 text-xs text-muted sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="flex flex-col gap-1">
          <p>
            Built with{" "}
            <a href="https://unlayer.com" target="_blank" rel="noopener noreferrer" className="text-teal underline-offset-2 hover:underline">
              Unlayer React Image Editor
            </a>{" "}
            · #BuiltWithImageEditor
          </p>
          <p>Your drawings are sent to Google&apos;s Gemini AI for judging. We don&apos;t store them.</p>
        </div>
        <p className="max-w-md sm:text-right">
          Unofficial fan project. Not affiliated with or endorsed by Rockstar Games or Take-Two Interactive. All art is original.
        </p>
      </footer>
    </main>
  );
}
