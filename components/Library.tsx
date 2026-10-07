"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { CaseIndexEntry } from "@/lib/cases";
import { CASE_TYPES, QUANT_LABEL, label } from "@/lib/taxonomy";
import { useProgress } from "@/components/useProgress";
import { EMPTY_FILTERS, FILTER_KEYS, type Filters, matches, parseFilters, toQuery } from "@/components/filters";

type Opt = { value: string; label: string; count: number };
type SortKey = "recent" | "easy" | "hard" | "title";

function Chip({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: React.ReactNode; count?: number }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-9 rounded-full border px-3 text-sm transition-colors ${active ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-ink-2 hover:bg-surface-2"}`}
    >
      {children}
      {count != null && <span className={`ml-1 tabular-nums ${active ? "opacity-80" : "text-muted"}`}>{count}</span>}
    </button>
  );
}

function Meter({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Difficulty ${value} of 5`} title={`Difficulty ${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`h-2 w-2 rounded-full ${i <= value ? "bg-series" : "bg-line"}`} />
      ))}
    </span>
  );
}

export function Library({ index }: { index: CaseIndexEntry[] }) {
  const sp = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { isSolved } = useProgress();
  const filters = useMemo(() => parseFilters(new URLSearchParams(sp.toString())), [sp]);
  const [q, setQ] = useState(filters.q);
  const [view, setView] = useState<"cards" | "list">("cards");
  const [sort, setSort] = useState<SortKey>("recent");

  useEffect(() => {
    try {
      const v = localStorage.getItem("cc-view");
      if (v === "list" || v === "cards") setView(v);
    } catch {}
  }, []);

  const apply = (f: Filters) => startTransition(() => router.replace(`/library${toQuery(f)}`, { scroll: false }));

  // Debounced search box → URL
  useEffect(() => {
    if (q === filters.q) return;
    const t = setTimeout(() => apply({ ...filters, q }), 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const toggle = (key: (typeof FILTER_KEYS)[number], value: string) => {
    const cur = filters[key];
    apply({ ...filters, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] });
  };

  const results = useMemo(() => {
    const r = index.filter((c) => matches(c, filters, isSolved));
    const cmp: Record<SortKey, (a: CaseIndexEntry, b: CaseIndexEntry) => number> = {
      recent: (a, b) => b.year - a.year || a.title.localeCompare(b.title),
      easy: (a, b) => a.difficulty - b.difficulty || b.year - a.year,
      hard: (a, b) => b.difficulty - a.difficulty || b.year - a.year,
      title: (a, b) => a.title.localeCompare(b.title),
    };
    return r.sort(cmp[sort]);
  }, [index, filters, isSolved, sort]);

  // Facet counts are computed against the full library so options never disappear.
  const opts = useMemo(() => {
    const count = (fn: (c: CaseIndexEntry) => string[]) => {
      const m = new Map<string, number>();
      index.forEach((c) => fn(c).forEach((k) => m.set(k, (m.get(k) ?? 0) + 1)));
      return m;
    };
    const toOpts = (m: Map<string, number>, lab: (k: string) => string = (k) => k, order?: string[]): Opt[] =>
      [...m.entries()]
        .map(([value, n]) => ({ value, label: lab(value), count: n }))
        .sort((a, b) => (order ? order.indexOf(a.value) - order.indexOf(b.value) : b.count - a.count));
    return {
      type: toOpts(count((c) => c.case_type), undefined, [...CASE_TYPES]),
      industry: toOpts(count((c) => [c.industry]), label),
      difficulty: toOpts(count((c) => [String(c.difficulty)]), (k) => `${k}/5`, ["1", "2", "3", "4", "5"]),
      school: toOpts(count((c) => [c.school])),
      year: toOpts(count((c) => [String(c.year)])).sort((a, b) => Number(b.value) - Number(a.value)),
      format: toOpts(count((c) => [c.format]), (k) => k.replace(/^./, (x) => x.toUpperCase())),
      quant: toOpts(count((c) => [c.quant_intensity]), (k) => `Quant ${QUANT_LABEL[k]}`, ["L", "M", "H"]),
    };
  }, [index]);

  const active = FILTER_KEYS.reduce((n, k) => n + filters[k].length, 0) + (filters.status ? 1 : 0);
  const groups: { key: (typeof FILTER_KEYS)[number]; title: string }[] = [
    { key: "type", title: "Case type" },
    { key: "industry", title: "Industry" },
    { key: "difficulty", title: "Difficulty" },
    { key: "format", title: "Format" },
    { key: "quant", title: "Quant intensity" },
    { key: "school", title: "School" },
    { key: "year", title: "Year" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
          <p className="text-sm text-muted" aria-live="polite">
            {results.length} of {index.length} cases
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="sort">Sort</label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="min-h-9 rounded-lg border border-line bg-surface px-2 text-sm">
            <option value="recent">Newest first</option>
            <option value="easy">Easiest first</option>
            <option value="hard">Hardest first</option>
            <option value="title">A–Z</option>
          </select>
          <div role="group" aria-label="View" className="flex rounded-lg border border-line bg-surface p-0.5">
            {(["cards", "list"] as const).map((v) => (
              <button
                key={v}
                aria-pressed={view === v}
                onClick={() => {
                  setView(v);
                  try {
                    localStorage.setItem("cc-view", v);
                  } catch {}
                }}
                className={`min-h-8 rounded-md px-3 text-sm capitalize ${view === v ? "bg-surface-2 font-semibold" : "text-muted"}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        <label htmlFor="q" className="sr-only">Search cases</label>
        <input
          id="q"
          type="search"
          inputMode="search"
          placeholder="Search titles, prompts, tags… e.g. breakeven airline"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-11 w-full rounded-xl border border-line bg-surface px-4 text-base placeholder:text-muted"
        />
      </div>

      <details className="rounded-xl border border-line bg-surface">
        <summary className="flex min-h-11 items-center justify-between px-4 text-sm font-semibold">
          <span className="flex items-center gap-2">
            <span className="chev inline-block transition-transform" aria-hidden>›</span>
            Filters {active > 0 && <span className="rounded-full bg-accent px-2 text-xs text-accent-ink">{active}</span>}
          </span>
          {active > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setQ("");
                apply(EMPTY_FILTERS);
              }}
              className="text-xs font-medium text-ink-2 underline underline-offset-2"
            >
              Clear all
            </button>
          )}
        </summary>
        <div className="space-y-4 border-t border-line p-4">
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Status</legend>
            <div className="flex flex-wrap gap-2">
              {[
                ["", "All"],
                ["unsolved", "Unsolved"],
                ["solved", "Solved"],
              ].map(([v, l]) => (
                <Chip key={v} active={filters.status === v} onClick={() => apply({ ...filters, status: v })}>
                  {l}
                </Chip>
              ))}
            </div>
          </fieldset>
          {groups.map((g) => (
            <fieldset key={g.key}>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{g.title}</legend>
              <div className="flex flex-wrap gap-2">
                {opts[g.key].map((o) => (
                  <Chip key={o.value} active={filters[g.key].includes(o.value)} onClick={() => toggle(g.key, o.value)} count={o.count}>
                    {o.label}
                  </Chip>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </details>

      {results.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">No cases match these filters.</p>
      ) : view === "cards" ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((c) => (
            <li key={c.id}>
              <Link prefetch={false} href={`/case/${c.id}`} className="flex h-full flex-col rounded-xl border border-line bg-surface p-4 hover:bg-surface-2">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold leading-snug">{c.title}</h2>
                  {isSolved(c.id) && <span className="shrink-0 rounded-full bg-chip px-2 py-0.5 text-xs text-ok">✓ Solved</span>}
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {c.school} {c.edition} · {c.format === "interviewer-led" ? "Interviewer-led" : c.format === "candidate-led" ? "Candidate-led" : "Format n/a"}
                </p>
                <p className="mt-2 line-clamp-3 text-sm text-ink-2">{c.teaser}…</p>
                <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3 text-xs">
                  {c.case_type.slice(0, 2).map((t) => (
                    <span key={t} className="rounded-md bg-chip px-2 py-0.5">{t}</span>
                  ))}
                  <span className="rounded-md bg-chip px-2 py-0.5">{label(c.industry)}</span>
                  <span className="ml-auto flex items-center gap-2 text-muted">
                    <Meter value={c.difficulty} />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {results.map((c) => (
            <li key={c.id}>
              <Link prefetch={false} href={`/case/${c.id}`} className="grid grid-cols-[1fr_auto] items-center gap-x-3 px-4 py-3 hover:bg-surface-2 md:grid-cols-[2fr_1.3fr_1fr_auto_auto]">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{isSolved(c.id) && <span className="mr-1 text-ok" aria-label="Solved">✓</span>}{c.title}</span>
                  <span className="block truncate text-xs text-muted md:hidden">{c.case_type[0]} · {label(c.industry)} · {c.school} {c.year}</span>
                </span>
                <span className="hidden truncate text-sm text-ink-2 md:block">{c.case_type.join(", ")}</span>
                <span className="hidden truncate text-sm text-ink-2 md:block">{label(c.industry)}</span>
                <span className="hidden text-sm text-muted md:block">{c.school} {c.year}</span>
                <Meter value={c.difficulty} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
