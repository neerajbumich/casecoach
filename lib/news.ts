import "server-only";
import type { NewsItem } from "@/lib/news-rank";

// Free public RSS feeds only: no API key, no cost. Fetched on the server and cached for 30 minutes,
// so opening the app never hits the sources more than twice an hour per feed.
// WSJ stories open on wsj.com, where the user's own (university) subscription gives the full article.

type Feed = { id: string; source: string; section: string; url: string; paywalled: boolean };

export const FEEDS: Feed[] = [
  { id: "wsj-business", source: "WSJ", section: "Business", url: "https://feeds.content.dowjones.io/public/rss/WSJcomUSBusiness", paywalled: true },
  { id: "wsj-markets", source: "WSJ", section: "Markets", url: "https://feeds.content.dowjones.io/public/rss/RSSMarketsMain", paywalled: true },
  { id: "wsj-tech", source: "WSJ", section: "Tech", url: "https://feeds.content.dowjones.io/public/rss/RSSWSJD", paywalled: true },
  { id: "wsj-world", source: "WSJ", section: "World", url: "https://feeds.content.dowjones.io/public/rss/RSSWorldNews", paywalled: true },
  { id: "consulting-us", source: "Consulting.us", section: "Consulting", url: "https://www.consulting.us/rss/consultancy_rssfeed.xml", paywalled: false },
  { id: "techcrunch", source: "TechCrunch", section: "Tech", url: "https://techcrunch.com/feed/", paywalled: false },
];

const REVALIDATE_S = 1800;

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", mdash: "—", ndash: "–", hellip: "…" };
export function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

function field(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decode(m[1]) : "";
}

/** Minimal RSS 2.0 parser: enough for title, link, description and pubDate. */
export function parseRss(xml: string, feed: Pick<Feed, "source" | "section" | "paywalled">): NewsItem[] {
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  const out: NewsItem[] = [];
  for (const it of items) {
    const title = field(it, "title");
    const link = field(it, "link") || field(it, "guid");
    const date = new Date(field(it, "pubDate") || field(it, "dc:date"));
    if (!title || !/^https:\/\//.test(link) || isNaN(date.getTime())) continue;
    out.push({
      id: link,
      title,
      link,
      summary: field(it, "description").slice(0, 300),
      published: date.toISOString(),
      source: feed.source,
      section: feed.section,
      paywalled: feed.paywalled,
    });
  }
  return out;
}

async function fetchFeed(f: Feed): Promise<NewsItem[]> {
  // Local testing without internet: NEWS_FIXTURE_DIR=<dir with <feed-id>.xml files>. Ignored on Vercel.
  const fx = process.env.NEWS_FIXTURE_DIR;
  if (fx && !process.env.VERCEL) {
    const { readFile } = await import("node:fs/promises");
    return parseRss(await readFile(`${fx}/${f.id}.xml`, "utf8"), f);
  }
  const res = await fetch(f.url, {
    next: { revalidate: REVALIDATE_S },
    signal: AbortSignal.timeout(8000),
    headers: { "user-agent": "CaseCoach/1.0 (personal study app; RSS reader)", accept: "application/rss+xml, application/xml, text/xml" },
  });
  if (!res.ok) throw new Error(`${f.id}: HTTP ${res.status}`);
  return parseRss(await res.text(), f);
}

let memo: { at: number; value: { items: NewsItem[]; failed: string[] } } | null = null;

/** All stories from all feeds, de-duplicated. Never throws: failed feeds are listed instead. */
export async function getNews(): Promise<{ items: NewsItem[]; failed: string[] }> {
  if (memo && Date.now() - memo.at < REVALIDATE_S * 1000) return memo.value;
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const failed: string[] = [];
  const seen = new Set<string>();
  const items: NewsItem[] = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") return void failed.push(FEEDS[i].source === "WSJ" ? `WSJ ${FEEDS[i].section}` : FEEDS[i].source);
    for (const it of r.value) {
      const key = it.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(it);
    }
  });
  const value = { items, failed };
  // Don't pin an all-failed result for 30 minutes (e.g. the laptop was offline for a moment).
  if (items.length) memo = { at: Date.now(), value };
  return value;
}
