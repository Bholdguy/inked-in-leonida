import InkEditor from "@/components/studio/InkEditor";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10">
      <header>
        <h1 className="text-4xl font-bold tracking-widest">INKED IN LEONIDA</h1>
        <p className="mt-2 text-neutral-400">Night shift on the strip.</p>
      </header>
      <InkEditor />
    </main>
  );
}
