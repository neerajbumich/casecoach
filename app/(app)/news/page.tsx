import Link from "next/link";
import { NewsList } from "@/components/NewsList";
import { radar } from "@/lib/news-page";
import type { Lens } from "@/lib/news-rank";
import { FEEDS } from "@/lib/news";

export const metadata = { title: "Recruiting radar" };

const LENSES: { key: Lens; label: string; blurb: string }[] = [
  { key: "top", label: "Top", blurb: "Everything relevant to consulting and tech recruiting, most relevant and recent first." },
  { key: "consulting", label: "Consulting", blurb: "Firm news, hires and promotions, deals and how AI is changing the industry." },
  { key: "tech", label: "Tech", blurb: "Big tech and startup moves, AI, and hiring or layoffs." },
  { key: "consumer", label: "US consumer", blurb: "Retail, restaurants, brands and spending: how American consumers are behaving right now. Pairs with the US Playbook." },
  { key: "deals", label: "Deals & strategy", blurb: "M&A, entries, pricing moves and turnarounds: ready-made case practice." },
];

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ lens?: string }> }) {
  const { lens: raw } = await searchParams;
  const lens = (LENSES.find((l) => l.key === raw)?.key ?? "top") as Lens;
  const { items, failed, total } = await radar(lens, 30);
  const sources = [...new Set(FEEDS.map((f) => (f.source === "WSJ" ? "WSJ" : f.source)))].join(", ");
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/learn" className="hover:underline">Learn</Link> / News
      </nav>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Recruiting radar</h1>
        <p className="text-sm text-ink-2">News ranked for consulting and tech recruiting, with why each story matters. WSJ stories open on wsj.com, where your umich subscription gives the full article.</p>
      </header>
      <nav aria-label="Filter" className="-mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2">
          {LENSES.map((l) => (
            <li key={l.key}>
              <Link
                href={l.key === "top" ? "/news" : `/news?lens=${l.key}`}
                aria-current={l.key === lens ? "page" : undefined}
                className="inline-flex min-h-9 items-center whitespace-nowrap rounded-full border border-line px-3 text-sm aria-[current=page]:border-accent aria-[current=page]:bg-accent aria-[current=page]:text-accent-ink"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p className="text-xs text-muted">{LENSES.find((l) => l.key === lens)!.blurb}</p>
      <section className="rounded-xl border border-line bg-surface p-4">
        {total === 0 ? (
          <p className="text-sm text-muted">News is unavailable right now{failed.length ? ` (couldn't reach ${failed.join(", ")})` : ""}. It retries automatically; pages you opened before still work offline.</p>
        ) : (
          <NewsList items={items} />
        )}
      </section>
      <p className="text-xs text-muted">
        Sources: {sources} (free public feeds, refreshed every 30 minutes). {failed.length > 0 && total > 0 && `Couldn't reach: ${failed.join(", ")}.`}
      </p>
    </div>
  );
}
