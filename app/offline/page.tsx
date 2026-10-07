export const metadata = { title: "Offline" };

// Public fallback page. It must never contain case content.
export default function Offline() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 text-center">
      <h1 className="text-xl font-semibold">You&apos;re offline</h1>
      <p className="mt-2 text-sm text-ink-2">This page wasn&apos;t saved on this device yet. Cases you&apos;ve opened before, and everything saved from Settings, still work.</p>
      <a href="/library" className="mx-auto mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">Go to library</a>
    </main>
  );
}
