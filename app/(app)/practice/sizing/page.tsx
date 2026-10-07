import Link from "next/link";
import { listSizing } from "@/lib/sizing";
import { getStore } from "@/lib/store";
import type { DrillResult } from "@/lib/training-types";

export const metadata = { title: "Market sizing" };
const DIFF = ["", "Easy", "Medium", "Hard"];

export default async function SizingIndex() {
  const all = listSizing();
  const done = new Map<string, boolean>();
  for (const r of await getStore().listItems<DrillResult>("drill").catch(() => [])) {
    if (r.data.drill === "sizing" && r.data.ref) done.set(r.data.ref, (done.get(r.data.ref) ?? false) || r.data.score >= 1);
  }
  const untried = all.filter((p) => !done.has(p.id));
  const next = untried.find((p) => p.difficulty === 1) ?? untried[0] ?? all[0];
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <nav aria-label="Breadcrumb" className="text-sm text-muted"><Link href="/practice" className="hover:underline">Practice</Link> / Market sizing</nav>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Market sizing</h1>
        <p className="text-sm text-ink-2">{all.length} problems with a model approach, assumptions and an acceptable range. Target 5 minutes each, talking out loud.</p>
      </header>
      <Link href={`/practice/sizing/${next.id}`} className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-ink">Start: {next.question}</Link>
      {[1, 2, 3].map((d) => (
        <section key={d} aria-labelledby={`h-d${d}`}>
          <h2 id={`h-d${d}`} className="mb-2 font-semibold">{DIFF[d]}</h2>
          <ul className="space-y-2">
            {all.filter((p) => p.difficulty === d).map((p) => (
              <li key={p.id}>
                <Link href={`/practice/sizing/${p.id}`} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-surface p-3 hover:bg-surface-2">
                  <span className="text-sm">{p.question}</span>
                  <span className="shrink-0 text-xs text-muted">{done.has(p.id) ? (done.get(p.id) ? "✓ in range" : "tried") : ""}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
