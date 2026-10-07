import Link from "next/link";
import { listFirms, TIER_ORDER } from "@/lib/firms";

export const metadata = { title: "Firms" };

export default function FirmsPage() {
  const firms = listFirms();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/learn" className="hover:underline">Learn</Link> / Firms
      </nav>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Firms</h1>
        <p className="text-sm text-ink-2">How each firm interviews, what it looks for, and angles for &ldquo;why us&rdquo;. Checked against the firms&apos; own careers pages where possible; confirm details with recruiters, since processes change.</p>
      </header>
      {TIER_ORDER.map((t) => {
        const fs = firms.filter((f) => f.tier === t);
        if (!fs.length) return null;
        return (
          <section key={t} aria-labelledby={`h-${t}`}>
            <h2 id={`h-${t}`} className="mb-2 font-semibold">{t}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {fs.map((f) => (
                <li key={f.id}>
                  <Link href={`/firms/${f.id}`} className="block h-full rounded-xl border border-line bg-surface p-4 hover:bg-surface-2">
                    <span className="block font-semibold">{f.name}</span>
                    <span className="mt-1 block text-sm text-ink-2">{f.one_liner}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
