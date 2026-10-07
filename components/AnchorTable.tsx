"use client";
import { useMemo, useState } from "react";

type Anchor = { id: string; category: string; label: string; value: string; interview_value: string; note: string; source: string; year: number };

export function AnchorTable({ anchors }: { anchors: Anchor[] }) {
  const [q, setQ] = useState("");
  const cats = useMemo(() => [...new Set(anchors.map((a) => a.category))], [anchors]);
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? anchors.filter((a) => `${a.label} ${a.note} ${a.category}`.toLowerCase().includes(t)) : anchors;
  }, [anchors, q]);
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="sr-only">Search numbers</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: cars, dogs, restaurants, broadband…" className="min-h-11 w-full rounded-lg border border-line bg-surface px-3" />
      </label>
      {cats.map((cat) => {
        const rows = shown.filter((a) => a.category === cat);
        if (!rows.length) return null;
        return (
          <section key={cat} className="rounded-xl border border-line bg-surface p-4" aria-labelledby={`h-${cat}`}>
            <h2 id={`h-${cat}`} className="font-semibold">{cat}</h2>
            <dl className="mt-2 divide-y divide-line">
              {rows.map((a) => (
                <div key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 py-2">
                  <dt className="text-sm font-medium">{a.label}</dt>
                  <dd className="text-right text-sm font-semibold tabular-nums">{a.interview_value}</dd>
                  <dd className="col-span-2 text-xs text-muted">
                    {a.value} ({a.year}) · {a.note}{" "}
                    <a href={a.source} target="_blank" rel="noopener noreferrer" className="underline">source</a>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
      {shown.length === 0 && <p className="text-sm text-muted">No matches.</p>}
    </div>
  );
}
