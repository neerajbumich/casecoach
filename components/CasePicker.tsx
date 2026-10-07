"use client";
import Link from "next/link";
import { useMemo, useState } from "react";

type C = { id: string; title: string; school: string; case_type: string[]; difficulty: number; industry: string };

export function CasePicker({ cases, hrefBase, hrefSuffix = "" }: { cases: C[]; hrefBase: string; hrefSuffix?: string }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const f = t ? cases.filter((c) => `${c.title} ${c.school} ${c.case_type.join(" ")} ${c.industry}`.toLowerCase().includes(t)) : cases;
    return f.slice(0, 30);
  }, [cases, q]);
  return (
    <div className="space-y-2">
      <label className="block">
        <span className="sr-only">Search cases</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, type, industry or school" className="min-h-11 w-full rounded-lg border border-line bg-surface px-3" />
      </label>
      <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
        {list.map((c) => (
          <li key={c.id}>
            <Link prefetch={false} href={`${hrefBase}${c.id}${hrefSuffix}`} className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-surface-2">
              <span className="min-w-0">
                <span className="block truncate font-medium">{c.title}</span>
                <span className="block truncate text-xs text-muted">{c.school} · {c.case_type.join(" · ")}</span>
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted">{c.difficulty}/5</span>
            </Link>
          </li>
        ))}
        {list.length === 0 && <li className="px-3 py-3 text-sm text-muted">No matches.</li>}
      </ul>
    </div>
  );
}
