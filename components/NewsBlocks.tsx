import Link from "next/link";
import { NewsList } from "@/components/NewsList";
import { industryNews, radar } from "@/lib/news-page";

// Async server components, rendered inside <Suspense> so a slow feed never blocks the page.

function Unavailable({ failed }: { failed: string[] }) {
  return <p className="text-sm text-muted">News is unavailable right now{failed.length ? ` (couldn't reach ${failed.join(", ")})` : ""}. It retries automatically.</p>;
}

export async function HomeHeadlines() {
  const { items, failed, total } = await radar("top", 4);
  return (
    <section aria-labelledby="h-radar" className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 id="h-radar" className="font-semibold">Recruiting radar</h2>
        <Link href="/news" className="text-sm underline">All stories →</Link>
      </div>
      {total === 0 ? <Unavailable failed={failed} /> : <NewsList items={items} compact />}
    </section>
  );
}

export async function IndustryNews({ news, name }: { news: { keywords: string[]; companies: string[] }; name: string }) {
  const { items, failed, total } = await industryNews(news);
  if (total === 0) return <Unavailable failed={failed} />;
  return items.length ? <NewsList items={items} /> : <p className="text-sm text-muted">No {name} stories in the feeds from the last two weeks. Try the <Link href="/news" className="underline">Recruiting radar</Link>.</p>;
}

export function NewsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-hidden className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-4 w-11/12 animate-pulse rounded bg-surface-2" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}
