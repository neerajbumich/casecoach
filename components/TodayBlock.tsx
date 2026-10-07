import Link from "next/link";
import { getStore } from "@/lib/store";
import { activityDays, caseOfTheDay, dueCards, streak } from "@/lib/training";
import type { DrillResult, SrsState } from "@/lib/training-types";
import { label } from "@/lib/taxonomy";

// Home: today's case, streak and quick drills. Server component.
export async function TodayBlock() {
  const store = getStore();
  const [sessions, progress, drills, srs] = await Promise.all([
    store.listSessions().catch(() => []),
    store.getProgress().catch(() => ({})),
    store.listItems<DrillResult>("drill").catch(() => []),
    store.listItems<SrsState>("srs").catch(() => []),
  ]);
  const { c, why } = caseOfTheDay(sessions, new Set(Object.keys(progress)));
  const days = activityDays(sessions, drills.map((d) => d.data));
  const s = streak(days);
  const due = dueCards(srs);
  const quick = [
    { href: "/practice/math", label: "Mental math", note: "10 min" },
    { href: "/practice/cards", label: "Flashcards", note: due ? `${due} due` : "new cards" },
    { href: "/practice/sizing", label: "Market sizing", note: "5 min" },
    { href: "/communication/drill/synthesis", label: "60-sec recommendation", note: "2 min" },
  ];
  return (
    <section aria-labelledby="h-today" className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="h-today" className="text-xs font-semibold uppercase tracking-wide text-muted">Case of the day</h2>
          <span className="text-xs text-muted">{s > 0 ? `🔥 ${s}-day streak` : "Start a streak today"}</span>
        </div>
        <p className="mt-1 text-lg font-semibold">{c.title}</p>
        <p className="text-sm text-ink-2">{c.case_type.join(" · ")} · {label(c.industry)} · {c.difficulty}/5 · {c.school}</p>
        <p className="mt-1 text-sm text-ink-2">{why}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link prefetch={false} href={`/practice/${c.id}`} className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-ink">Practice it</Link>
          <Link prefetch={false} href={`/case/${c.id}`} className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-semibold">Read it</Link>
        </div>
      </div>
      <nav aria-label="Quick drills" className="rounded-xl border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Quick drills</p>
        <ul className="mt-2 space-y-1">
          {quick.map((q) => (
            <li key={q.href}>
              <Link href={q.href} className="flex min-h-10 items-center justify-between gap-2 rounded-lg px-2 hover:bg-surface-2">
                <span className="text-sm font-medium">{q.label}</span>
                <span className="text-xs tabular-nums text-muted">{q.note}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
