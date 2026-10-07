"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { CaseIndexEntry } from "@/lib/cases";
import { CASE_TYPES, label } from "@/lib/taxonomy";
import { useProgress } from "@/components/useProgress";

type Row = { key: string; name: string; count: number; href: string };

function countBy(index: CaseIndexEntry[], keys: (c: CaseIndexEntry) => string[]) {
  const m = new Map<string, number>();
  for (const c of index) for (const k of keys(c)) m.set(k, (m.get(k) ?? 0) + 1);
  return m;
}

// Single-series horizontal bars: one hue, value labels in text ink, each row is a link that filters the library.
function BarList({ title, rows, note }: { title: string; rows: Row[]; note?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? rows : rows.slice(0, 8);
  return (
    <section className="min-w-0 rounded-xl border border-line bg-surface p-4" aria-labelledby={`h-${title}`}>
      <h2 id={`h-${title}`} className="text-sm font-semibold">{title}</h2>
      {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
      <ul className="mt-3 space-y-1">
        {shown.map((r) => (
          <li key={r.key}>
            <Link
              href={r.href}
              prefetch={false}
              className="group grid grid-cols-[minmax(0,9.5rem)_1fr_2rem] items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-surface-2"
              title={`${r.name}: ${r.count} case${r.count === 1 ? "" : "s"} — open in library`}
            >
              <span className="truncate text-ink-2">{r.name}</span>
              <span className="relative h-3" aria-hidden>
                <span
                  className="absolute inset-y-0 left-0 rounded-r-[4px] bg-series transition-opacity group-hover:opacity-80"
                  style={{ width: `${Math.max(3, (r.count / max) * 100)}%` }}
                />
              </span>
              <span className="text-right tabular-nums text-ink">{r.count}</span>
            </Link>
          </li>
        ))}
      </ul>
      {rows.length > 8 && (
        <button onClick={() => setShowAll((s) => !s)} className="mt-2 text-xs font-medium text-ink-2 underline underline-offset-2">
          {showAll ? "Show fewer" : `Show all ${rows.length}`}
        </button>
      )}
    </section>
  );
}

function Heatmap({ index }: { index: CaseIndexEntry[] }) {
  const types = CASE_TYPES.filter((t) => index.some((c) => c.case_type.includes(t)));
  const inds = [...countBy(index, (c) => [c.industry]).entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k]) => k);
  const cell = (t: string, i: string) => index.filter((c) => c.industry === i && c.case_type.includes(t)).length;
  const max = Math.max(1, ...types.flatMap((t) => inds.map((i) => cell(t, i))));
  // Sequential single-hue ramp (light → dark); zero cells recede to the surface.
  const RAMP = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95"];
  const color = (v: number) => (v === 0 ? "transparent" : RAMP[Math.min(RAMP.length - 1, Math.floor(((v - 1) / Math.max(1, max - 1)) * (RAMP.length - 1)))]);
  return (
    <section className="min-w-0 rounded-xl border border-line bg-surface p-4 md:col-span-2" aria-labelledby="h-heat">
      <h2 id="h-heat" className="text-sm font-semibold">Case type × industry</h2>
      <p className="mt-0.5 text-xs text-muted">Top {inds.length} industries. Darker = more cases. Tap a cell to open those cases.</p>
      <div className="mt-3 overflow-x-auto">
        <table className="border-separate border-spacing-[2px] text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-surface" />
              {inds.map((i) => (
                <th key={i} scope="col" className="h-24 w-8 align-bottom font-normal text-ink-2">
                  <span className="inline-block w-8 origin-bottom-left translate-x-3 -rotate-60 whitespace-nowrap text-left">{label(i)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr key={t}>
                <th scope="row" className="sticky left-0 z-10 bg-surface pr-2 text-left font-normal whitespace-nowrap text-ink-2">{t}</th>
                {inds.map((i) => {
                  const v = cell(t, i);
                  return (
                    <td key={i} className="p-0">
                      {v ? (
                        <Link
                          prefetch={false}
                          href={`/library?type=${encodeURIComponent(t)}&industry=${i}`}
                          title={`${t} · ${label(i)}: ${v}`}
                          className="grid h-8 w-8 place-items-center rounded-[4px] tabular-nums"
                          style={{ background: color(v), color: v / max > 0.5 ? "#fff" : "#0b0b0b" }}
                        >
                          {v}
                        </Link>
                      ) : (
                        <span role="img" className="block h-8 w-8 rounded-[4px] border border-line" aria-label={`${t} · ${label(i)}: 0`} />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function Dashboard({ index, children }: { index: CaseIndexEntry[]; children?: React.ReactNode }) {
  const { isSolved, progress } = useProgress();
  const solved = index.filter((c) => isSolved(c.id)).length;

  const data = useMemo(() => {
    const sortDesc = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]);
    const types: Row[] = sortDesc(countBy(index, (c) => c.case_type)).map(([k, n]) => ({ key: k, name: k, count: n, href: `/library?type=${encodeURIComponent(k)}` }));
    const inds: Row[] = sortDesc(countBy(index, (c) => [c.industry])).map(([k, n]) => ({ key: k, name: label(k), count: n, href: `/library?industry=${k}` }));
    const diff: Row[] = [1, 2, 3, 4, 5].map((d) => ({ key: String(d), name: `${d} · ${["Warm-up", "Easy", "Medium", "Hard", "Very hard"][d - 1]}`, count: index.filter((c) => c.difficulty === d).length, href: `/library?difficulty=${d}` })).filter((r) => r.count);
    const books: Row[] = [...countBy(index, (c) => [`${c.school}|${c.year}`]).entries()]
      .sort((a, b) => Number(b[0].split("|")[1]) - Number(a[0].split("|")[1]) || a[0].localeCompare(b[0]))
      .map(([k, n]) => {
        const [s, y] = k.split("|");
        return { key: k, name: `${s} ${y}`, count: n, href: `/library?school=${encodeURIComponent(s)}&year=${y}` };
      });
    const fmt: Row[] = sortDesc(countBy(index, (c) => [c.format])).map(([k, n]) => ({ key: k, name: k.replace(/^./, (x) => x.toUpperCase()), count: n, href: `/library?format=${k}` }));
    return { types, inds, diff, books, fmt, bookCount: books.length };
  }, [index]);


  const tiles = [
    { k: "Cases", v: index.length },
    { k: "Solved", v: `${solved}` },
    { k: "Case books", v: data.bookCount },
    { k: "Exhibits", v: index.reduce((s, c) => s + c.exhibits, 0) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted">Tap any bar or cell to open those cases in the library.</p>
        </div>
        <Link href="/library" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">Browse library</Link>
      </div>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.k} className="rounded-xl border border-line bg-surface p-4">
            <dt className="text-xs text-muted">{t.k}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{t.v}</dd>
          </div>
        ))}
      </dl>


      {children}

      <div className="grid gap-4 md:grid-cols-2">
        <BarList title="By case type" rows={data.types} note="A case can have more than one type." />
        <BarList title="By industry" rows={data.inds} />
        <BarList title="By difficulty" rows={data.diff} note="Book rating where given, otherwise inferred." />
        <BarList title="By case book" rows={data.books} />
        <Heatmap index={index} />
        <BarList title="By format" rows={data.fmt} />
      </div>
    </div>
  );
}
