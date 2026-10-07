import "server-only";
import { getNews } from "@/lib/news";
import { byLens, forIndustry, rank, type Lens, type Ranked } from "@/lib/news-rank";

export async function radar(lens: Lens, n = 30): Promise<{ items: Ranked[]; failed: string[]; total: number }> {
  const { items, failed } = await getNews();
  const ranked = rank(items);
  return { items: byLens(ranked, lens).slice(0, n), failed, total: items.length };
}

export async function industryNews(news: { keywords: string[]; companies: string[] }, n = 8) {
  const { items, failed } = await getNews();
  return { items: forIndustry(items, news, n), failed, total: items.length };
}
