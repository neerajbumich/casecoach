import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-xl font-semibold">Case not found</h1>
      <p className="mt-2 text-sm text-ink-2">It may have been renamed when new books were added.</p>
      <Link href="/library" className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">Back to library</Link>
    </div>
  );
}
