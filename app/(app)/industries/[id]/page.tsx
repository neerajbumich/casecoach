import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { IndustryNews, NewsSkeleton } from "@/components/NewsBlocks";
import { casesForIndustry, getIndustry } from "@/lib/industries";
import { getFramework } from "@/lib/frameworks";
import { chaptersForIndustry } from "@/lib/us";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: getIndustry(id)?.name ?? "Industry" };
}

const card = "rounded-xl border border-line bg-surface p-4";
const h2 = "font-semibold";

export default async function IndustryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ind = getIndustry(id);
  if (!ind) notFound();
  const cases = casesForIndustry(id);
  const usCh = chaptersForIndustry(id);

  return (
    <article className="mx-auto max-w-4xl space-y-5">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/industries" className="hover:underline">Industries</Link> / {ind.group}
      </nav>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{ind.name}</h1>
        <p className="text-ink-2">{ind.one_liner}</p>
      </header>

      <nav aria-label="On this page" className="-mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2 text-sm">
          {[["economics", "Economics"], ["metrics", "Metrics"], ["trends", "Trends"], ["cases", "Case angles"], ["news", "News"]].map(([h, l]) => (
            <li key={h}><a href={`#${h}`} className="inline-flex min-h-9 items-center whitespace-nowrap rounded-full bg-chip px-3">{l}</a></li>
          ))}
        </ul>
      </nav>

      <section id="economics" aria-labelledby="h-econ" className="scroll-mt-20 space-y-3">
        <h2 id="h-econ" className={h2}>How it makes money</h2>
        <p className="text-sm">{ind.how_it_makes_money}</p>
        <ol className="flex flex-wrap items-center gap-1.5 text-xs" aria-label="Value chain">
          {ind.value_chain.map((v, i) => (
            <li key={v} className="flex items-center gap-1.5">
              <span className="rounded-md border border-line bg-surface px-2 py-1">{v}</span>
              {i < ind.value_chain.length - 1 && <span aria-hidden className="text-muted">→</span>}
            </li>
          ))}
        </ol>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className={card}>
            <h3 className="text-sm font-semibold">Driver trees</h3>
            <ul className="mt-2 space-y-1.5 font-mono text-[13px]">
              {ind.revenue_formula.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </div>
          <div className={card}>
            <h3 className="text-sm font-semibold">Cost structure</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {ind.cost_structure.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </div>
        </div>
        <p className="text-sm"><span className="font-semibold">Margins: </span>{ind.margins}</p>
      </section>

      <section id="metrics" aria-labelledby="h-met" className={`${card} scroll-mt-20`}>
        <h2 id="h-met" className={h2}>Metrics to know</h2>
        <dl className="mt-2 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {ind.key_metrics.map((m) => (
            <div key={m.name}>
              <dt className="font-medium">{m.name}</dt>
              <dd className="text-ink-2">{m.what}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="trends" aria-labelledby="h-tr" className="scroll-mt-20 grid gap-3 sm:grid-cols-2">
        <div className={card}>
          <h2 id="h-tr" className={h2}>Current themes</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {ind.trends.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
        <div className={card}>
          <h2 className={h2}>Have a view on</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {ind.interview_hooks.map((t) => <li key={t}>{t}</li>)}
          </ul>
          <h3 className="mt-3 text-sm font-semibold">Key players</h3>
          <p className="mt-1 text-sm text-ink-2">{ind.key_players.join(" · ")}</p>
        </div>
      </section>

      <section id="cases" aria-labelledby="h-ca" className="scroll-mt-20 space-y-2">
        <h2 id="h-ca" className={h2}>Typical case questions</h2>
        <ul className="space-y-2">
          {ind.case_angles.map((a) => (
            <li key={a.question} className={`${card} flex flex-wrap items-baseline justify-between gap-2`}>
              <span className="text-sm">{a.question}</span>
              <Link href={`/frameworks/${a.framework_id}`} className="text-xs underline">{getFramework(a.framework_id)?.name ?? a.framework_id}</Link>
            </li>
          ))}
        </ul>
        <h3 className="pt-2 text-sm font-semibold">In your library ({cases.length})</h3>
        {cases.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {cases.map((c) => (
              <li key={c.id}>
                <Link prefetch={false} href={`/case/${c.id}`} className="block rounded-xl border border-line bg-surface p-3 hover:bg-surface-2">
                  <span className="block font-medium">{c.title}</span>
                  <span className="block text-xs text-muted">{c.school} · {c.case_type.join(" · ")} · {c.difficulty}/5</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No cases in this industry yet; more arrive as case books are extracted.</p>
        )}
      </section>

      {usCh.length > 0 && (
        <section aria-labelledby="h-usctx" className={card}>
          <h2 id="h-usctx" className={h2}>US context</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {usCh.map((c) => <li key={c.id}><Link href={`/us/${c.id}`} className="inline-flex min-h-9 items-center rounded-full bg-chip px-3 text-sm hover:bg-surface-2">{c.title}</Link></li>)}
          </ul>
        </section>
      )}

      <section id="news" aria-labelledby="h-news" className={`${card} scroll-mt-20`}>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 id="h-news" className={h2}>Latest news</h2>
          <Link href="/news" className="text-sm underline">Recruiting radar →</Link>
        </div>
        <Suspense fallback={<NewsSkeleton rows={4} />}>
          <IndustryNews news={ind.news} name={ind.name} />
        </Suspense>
      </section>
    </article>
  );
}
