import Link from "next/link";
import { listFrameworks } from "@/lib/frameworks";

export const metadata = { title: "Frameworks" };

export default function FrameworksPage() {
  const all = listFrameworks();
  const groups = [
    { key: "core", title: "Case frameworks", note: "Full structures for a case type. Tailor them; never recite." },
    { key: "tool", title: "Tools", note: "Building blocks you use inside a bucket: sizing, breakeven, Five Forces…" },
  ] as const;
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Frameworks</h1>
          <p className="text-sm text-muted">{all.length} canonical frameworks, each linked to the library cases that use it.</p>
        </div>
        <Link href="/frameworks/coach" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">Build a custom framework</Link>
      </div>
      {groups.map((g) => (
        <section key={g.key} aria-labelledby={`h-${g.key}`}>
          <h2 id={`h-${g.key}`} className="font-semibold">{g.title}</h2>
          <p className="mb-2 text-xs text-muted">{g.note}</p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {all
              .filter((f) => f.category === g.key)
              .sort((a, b) => b.caseCount - a.caseCount)
              .map((f) => (
                <li key={f.id}>
                  <Link href={`/frameworks/${f.id}`} className="flex h-full flex-col rounded-xl border border-line bg-surface p-4 hover:bg-surface-2">
                    <span className="font-semibold">{f.name}</span>
                    <span className="mt-1 line-clamp-3 text-sm text-ink-2">{f.summary}</span>
                    <span className="mt-auto pt-3 text-xs text-muted">{f.caseCount ? `${f.caseCount} case${f.caseCount === 1 ? "" : "s"} in your library` : "Used inside other frameworks"}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
