import Link from "next/link";
import { notFound } from "next/navigation";
import { casesForFramework, getFramework, listFrameworks } from "@/lib/frameworks";
import { FrameworkTree } from "@/components/FrameworkTree";
import { label } from "@/lib/taxonomy";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: getFramework(id)?.name ?? "Framework" };
}

const card = "rounded-xl border border-line bg-surface p-4";

export default async function FrameworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = getFramework(id);
  if (!f) notFound();
  const cases = casesForFramework(id);
  const names = new Map(listFrameworks().map((x) => [x.id, x.name]));
  const practice = cases[0];

  return (
    <article className="mx-auto max-w-4xl space-y-5">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/frameworks" className="hover:underline">Frameworks</Link> / <span>{f.category === "core" ? "Case framework" : "Tool"}</span>
      </nav>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{f.name}</h1>
        <p className="text-ink-2">{f.summary}</p>
      </header>

      <section aria-labelledby="h-open" className={card}>
        <h2 id="h-open" className="text-xs font-semibold uppercase tracking-wide text-muted">How to open with it</h2>
        <p className="mt-1 italic">&ldquo;{f.opening_line}&rdquo;</p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <section aria-labelledby="h-use" className={card}>
          <h2 id="h-use" className="font-semibold">Use it when</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {f.when_to_use.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </section>
        <section aria-labelledby="h-nouse" className={card}>
          <h2 id="h-nouse" className="font-semibold">Don&apos;t use it when</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {f.when_not_to_use.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </section>
      </div>

      <section aria-labelledby="h-tree" className="space-y-2">
        <h2 id="h-tree" className="font-semibold">Issue tree</h2>
        <FrameworkTree tree={f.tree} />
        <p className="text-xs text-muted">MECE: each branch is distinct, and together they cover the question. Rename branches to fit the case before you present.</p>
      </section>

      {f.buckets.length > 0 && (
        <section aria-labelledby="h-buckets" className="space-y-2">
          <h2 id="h-buckets" className="font-semibold">What to ask in each bucket</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {f.buckets.map((b) => (
              <div key={b.name} className={card}>
                <h3 className="font-medium">{b.name}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {b.questions.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
                {b.data_to_ask.length > 0 && (
                  <p className="mt-2 text-xs text-muted"><span className="font-semibold">Data to request:</span> {b.data_to_ask.join(" · ")}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {f.industry_adaptations.length > 0 && (
        <section aria-labelledby="h-ind" className={card}>
          <h2 id="h-ind" className="font-semibold">Industry adaptations</h2>
          <dl className="mt-2 space-y-2 text-sm">
            {f.industry_adaptations.map((a) => (
              <div key={a.industry}>
                <dt className="font-medium">{label(a.industry)}</dt>
                <dd className="text-ink-2">{a.note}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section aria-labelledby="h-mist" className={card}>
        <h2 id="h-mist" className="font-semibold">Common mistakes</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {f.common_mistakes.map((x, i) => <li key={i}>{x}</li>)}
        </ul>
      </section>

      {f.related.length > 0 && (
        <section aria-labelledby="h-rel">
          <h2 id="h-rel" className="mb-2 font-semibold">Related</h2>
          <ul className="flex flex-wrap gap-2">
            {f.related.filter((r) => names.has(r)).map((r) => (
              <li key={r}>
                <Link href={`/frameworks/${r}`} className="inline-flex min-h-9 items-center rounded-full bg-chip px-3 text-sm hover:bg-surface-2">{names.get(r)}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="h-cases">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 id="h-cases" className="font-semibold">Cases in your library that use it ({cases.length})</h2>
          {practice && (
            <Link prefetch={false} href={`/practice/${practice.id}`} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink">Practice with {practice.title}</Link>
          )}
        </div>
        {cases.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {cases.slice(0, 12).map((c) => (
              <li key={c.id}>
                <Link prefetch={false} href={`/case/${c.id}`} className="block rounded-xl border border-line bg-surface p-3 hover:bg-surface-2">
                  <span className="block font-medium">{c.title}</span>
                  <span className="block text-xs text-muted">{c.school} · {label(c.industry)} · {c.difficulty}/5</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No case is built mainly on this one; it shows up as a sub-bucket inside other frameworks.</p>
        )}
        {cases.length > 12 && <p className="mt-2 text-xs text-muted">Showing the 12 closest matches of {cases.length}.</p>}
      </section>
    </article>
  );
}
