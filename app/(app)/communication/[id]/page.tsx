import Link from "next/link";
import { notFound } from "next/navigation";
import { DRILLS, MODULES, getModule } from "@/lib/communication";
import { DIMENSIONS, MISTAKE_CATEGORIES } from "@/lib/scoring";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: getModule(id)?.title ?? "Communication" };
}

const card = "rounded-xl border border-line bg-surface p-4";

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = getModule(id);
  if (!m) notFound();
  const i = MODULES.findIndex((x) => x.id === id);
  const next = MODULES[i + 1];
  const dims = m.dimensions.map((d) => DIMENSIONS.find((x) => x.key === d)?.label).filter(Boolean);
  const mistakes = m.mistakes.map((k) => MISTAKE_CATEGORIES.find((x) => x.key === k)?.label).filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/communication" className="hover:underline">Communication</Link> / {i + 1} of {MODULES.length}
      </nav>
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{m.moment}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{m.title}</h1>
      </header>

      <section aria-label="The rule" className="rounded-xl bg-accent p-4 text-accent-ink">
        <p className="text-lg font-semibold leading-snug">{m.principle}</p>
      </section>

      <section aria-labelledby="h-why" className={card}>
        <h2 id="h-why" className="font-semibold">What the interviewer is judging</h2>
        <p className="mt-1 text-sm text-ink-2">{m.why}</p>
        <p className="mt-2 text-xs text-muted">Scorecard: {dims.join(", ")} · Journal mistakes it fixes: {mistakes.join(", ")}</p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <section aria-labelledby="h-do" className={card}>
          <h2 id="h-do" className="font-semibold">Do</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {m.dos.map((x, j) => <li key={j} className="flex gap-2"><span aria-hidden className="text-ok">✓</span><span>{x}</span></li>)}
          </ul>
        </section>
        <section aria-labelledby="h-dont" className={card}>
          <h2 id="h-dont" className="font-semibold">Don&apos;t</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {m.donts.map((x, j) => <li key={j} className="flex gap-2"><span aria-hidden className="text-warn">✕</span><span>{x}</span></li>)}
          </ul>
        </section>
      </div>

      <section aria-labelledby="h-phr" className="space-y-2">
        <h2 id="h-phr" className="font-semibold">Phrases to use</h2>
        {m.phrases.map((p) => (
          <div key={p.label} className={card}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{p.label}</h3>
            <ul className="mt-1 space-y-1">
              {p.lines.map((l, j) => <li key={j} className="italic">&ldquo;{l}&rdquo;</li>)}
            </ul>
          </div>
        ))}
      </section>

      {m.example && (
        <section aria-labelledby="h-ex" className="space-y-2">
          <h2 id="h-ex" className="font-semibold">Weak vs strong</h2>
          <p className="text-sm text-muted">{m.example.context}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={`${card} border-l-4 border-l-warn`}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Weak</h3>
              <p className="mt-1 text-sm">{m.example.weak}</p>
            </div>
            <div className={`${card} border-l-4 border-l-ok`}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Strong</h3>
              <p className="mt-1 text-sm">{m.example.strong}</p>
            </div>
          </div>
          <p className="text-sm text-ink-2"><span className="font-semibold">Why it works:</span> {m.example.why}</p>
        </section>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        {m.drill && (
          <Link href={`/communication/drill/${m.drill}`} className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-ink">Drill it: {DRILLS[m.drill].title}</Link>
        )}
        {next && (
          <Link href={`/communication/${next.id}`} className="inline-flex min-h-11 items-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold">Next: {next.title} →</Link>
        )}
      </div>
    </article>
  );
}
