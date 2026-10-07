import Link from "next/link";
import { GROUP_ORDER, listIndustries } from "@/lib/industries";

export const metadata = { title: "Industries" };

export default function IndustriesPage() {
  const all = listIndustries();
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/learn" className="hover:underline">Learn</Link> / Industries
      </nav>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Industries</h1>
        <p className="text-sm text-ink-2">{all.length} five-minute primers: how each industry makes money, the metrics to know, current themes, typical cases and the latest news.</p>
      </header>
      {GROUP_ORDER.map((g) => {
        const items = all.filter((i) => i.group === g).sort((a, b) => b.caseCount - a.caseCount || a.name.localeCompare(b.name));
        if (!items.length) return null;
        const hid = `h-${g.replace(/\W+/g, "-").toLowerCase()}`;
        return (
          <section key={g} aria-labelledby={hid}>
            <h2 id={hid} className="mb-2 font-semibold">{g}</h2>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((i) => (
                <li key={i.id}>
                  <Link href={`/industries/${i.id}`} className="flex h-full flex-col rounded-xl border border-line bg-surface p-3 hover:bg-surface-2">
                    <span className="font-medium">{i.name}</span>
                    <span className="mt-0.5 line-clamp-2 text-sm text-ink-2">{i.one_liner}</span>
                    <span className="mt-auto pt-2 text-xs text-muted">{i.caseCount ? `${i.caseCount} case${i.caseCount === 1 ? "" : "s"} in your library` : "No library cases yet"}</span>
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
