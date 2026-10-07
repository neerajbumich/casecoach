import Link from "next/link";
import { notFound } from "next/navigation";
import { UsBlock } from "@/components/UsBlocks";
import { getChapter, listChapters, SECTIONS } from "@/lib/us";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: getChapter(id)?.title ?? "US Playbook" };
}

export default async function UsChapterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getChapter(id);
  if (!c) notFound();
  const all = listChapters();
  const i = all.findIndex((x) => x.id === id);
  const next = all[i + 1];
  const section = SECTIONS.find((s) => s.id === c.section);
  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/us" className="hover:underline">US Playbook</Link> / {section?.title}
      </nav>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{c.title}</h1>
        <p className="text-ink-2">{c.summary}</p>
      </header>
      {c.blocks.map((b, j) => <UsBlock key={j} b={b} />)}
      <section aria-labelledby="h-case" className="rounded-xl bg-accent p-4 text-accent-ink">
        <h2 id="h-case" className="font-semibold">How this shows up in an interview</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">{c.in_a_case.map((x) => <li key={x}>{x}</li>)}</ul>
      </section>
      <div className="flex flex-wrap gap-2">
        <Link href="/practice/cards" className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-semibold">Review the {c.flashcards.length} flashcards</Link>
        {next && <Link href={`/us/${next.id}`} className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-ink">Next: {next.title} →</Link>}
      </div>
      {c.sources.length > 0 && (
        <footer className="text-xs text-muted">
          Checked {c.checked}. Sources:{" "}
          {c.sources.map((s, k) => {
            let host = s;
            try { host = new URL(s).hostname.replace(/^www\./, ""); } catch {}
            return <span key={s}>{k > 0 && ", "}<a href={s} target="_blank" rel="noopener noreferrer" className="underline">{host}</a></span>;
          })}
        </footer>
      )}
    </article>
  );
}
