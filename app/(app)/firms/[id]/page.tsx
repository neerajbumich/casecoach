import Link from "next/link";
import { notFound } from "next/navigation";
import { getFirm } from "@/lib/firms";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: getFirm(id)?.name ?? "Firm" };
}

const card = "rounded-xl border border-line bg-surface p-4";
const List = ({ items }: { items: string[] }) => <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{items.map((x) => <li key={x}>{x}</li>)}</ul>;

export default async function FirmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = getFirm(id);
  if (!f) notFound();
  const ip = f.interview_process;
  return (
    <article className="mx-auto max-w-3xl space-y-4">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/firms" className="hover:underline">Firms</Link> / {f.tier}
      </nav>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{f.name}</h1>
        <p className="text-ink-2">{f.one_liner}</p>
      </header>
      <section className={card} aria-labelledby="h-glance"><h2 id="h-glance" className="font-semibold">At a glance</h2><List items={f.at_a_glance} /></section>
      <section className={`${card} space-y-2`} aria-labelledby="h-proc">
        <h2 id="h-proc" className="font-semibold">Interview process</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm">{ip.rounds.map((r) => <li key={r}>{r}</li>)}</ol>
        <p className="text-sm"><b>Case:</b> {ip.case_style}</p>
        <p className="text-sm"><b>Fit:</b> {ip.fit_style}</p>
        <p className="text-sm"><b>Tests:</b> {ip.assessments}</p>
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
        <section className={card} aria-labelledby="h-look"><h2 id="h-look" className="font-semibold">What they look for</h2><List items={f.what_they_look_for} /></section>
        <section className={card} aria-labelledby="h-cult"><h2 id="h-cult" className="font-semibold">Culture notes</h2><List items={f.culture} /></section>
      </div>
      <section className={card} aria-labelledby="h-why"><h2 id="h-why" className="font-semibold">&ldquo;Why us&rdquo;: questions to answer for yourself</h2><List items={f.why_us_angles} /></section>
      <section className={card} aria-labelledby="h-tips"><h2 id="h-tips" className="font-semibold">How to prepare</h2><List items={f.prep_tips} /></section>
      <div className="flex flex-wrap gap-2">
        <Link href={`/practice?firm=${f.practice_mode}`} className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-ink">Practice a case in {{ mckinsey: "McKinsey", bcg: "BCG", bain: "Bain", tier2: "Tier 2" }[f.practice_mode]} style</Link>
        <Link href="/practice/fit" className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-semibold">Prepare fit stories</Link>
      </div>
      <footer className="text-xs text-muted">
        Checked {f.checked}. Sources:{" "}
        {f.sources.map((s, i) => <span key={s}>{i > 0 && ", "}<a href={s} target="_blank" rel="noopener noreferrer" className="underline">{new URL(s).hostname.replace(/^www\./, "")}</a></span>)}
      </footer>
    </article>
  );
}
