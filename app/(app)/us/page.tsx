import Link from "next/link";
import { listAnchors, listChapters, SECTIONS } from "@/lib/us";

export const metadata = { title: "US Playbook" };

export default function UsPage() {
  const chapters = listChapters();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/learn" className="hover:underline">Learn</Link> / US Playbook
      </nav>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">US Playbook</h1>
        <p className="text-sm text-ink-2">The American context case interviews quietly assume: how consumers shop and spend, how US business and healthcare work, and the norms of interviewing and networking here. Written for anyone who grew up outside the US.</p>
      </header>
      {SECTIONS.map((s) => (
        <section key={s.id} aria-labelledby={`h-${s.id}`}>
          <h2 id={`h-${s.id}`} className="font-semibold">{s.title}</h2>
          <p className="mb-2 text-xs text-muted">{s.blurb}</p>
          <ol className="grid gap-2 sm:grid-cols-2">
            {chapters.filter((c) => c.section === s.id).map((c) => (
              <li key={c.id}>
                <Link href={`/us/${c.id}`} className="block h-full rounded-xl border border-line bg-surface p-4 hover:bg-surface-2">
                  <span className="block font-semibold">{c.title}</span>
                  <span className="mt-1 line-clamp-2 block text-sm text-ink-2">{c.summary}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
      <section aria-labelledby="h-anchors">
        <h2 id="h-anchors" className="mb-2 font-semibold">Numbers to know</h2>
        <Link href="/us/anchors" className="block rounded-xl border border-line bg-surface p-4 hover:bg-surface-2">
          <span className="block font-semibold">US sizing anchors</span>
          <span className="mt-1 block text-sm text-ink-2">{listAnchors().length} verified US numbers for market sizing (people, spending, cars, pets, health, tech), each with the round number to use in a case and its source.</span>
        </Link>
      </section>
    </div>
  );
}
