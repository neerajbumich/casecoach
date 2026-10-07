// Pure news scoring (no I/O), so it can be unit-tested. Ranks stories by relevance to
// consulting and tech recruiting, tags them, and says why each one matters for interviews.

export type NewsItem = {
  id: string;
  title: string;
  link: string;
  summary: string;
  published: string; // ISO
  source: string; // "WSJ", "Consulting.us", "TechCrunch"
  section: string; // "Business", "Markets"…
  paywalled: boolean;
};

export type Tag = "Consulting" | "Tech" | "Hiring & jobs" | "M&A" | "Strategy" | "Earnings" | "AI" | "Consumer";
export type Ranked = NewsItem & { tags: Tag[]; score: number; why?: { text: string; framework?: string } };
export type Lens = "top" | "consulting" | "tech" | "deals" | "consumer";

const rx = (words: string[]) => new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?=$|[^\\p{L}\\p{N}])`, "iu");

const CONSULTING_FIRMS = rx([
  "McKinsey", "BCG", "Boston Consulting", "Bain & Company", "Bain & Co", "Deloitte", "Accenture", "PwC", "PricewaterhouseCoopers",
  "Ernst & Young", "EY", "KPMG", "Oliver Wyman", "Kearney", "L.E.K.", "Roland Berger", "Strategy&", "Booz Allen", "Alvarez & Marsal",
  "FTI Consulting", "Guidehouse", "ZS Associates", "Capgemini", "IBM Consulting", "Big Four", "Big 4",
]);
const CONSULTING_WORDS = rx(["consulting", "consultancy", "consultancies", "consultants", "consultant", "management consulting", "advisory firm"]);
// Bain Capital is a PE firm, not the consulting firm.
const BAIN_ALONE = /\bBain\b(?![\s-]+(?:Capital|backed|owned))/;

const TECH_COS = rx([
  "Apple", "Google", "Alphabet", "Microsoft", "Amazon", "AWS", "Meta", "Nvidia", "OpenAI", "Anthropic", "Tesla", "Netflix", "Salesforce",
  "Oracle", "Adobe", "Uber", "Airbnb", "Stripe", "Intel", "AMD", "IBM", "Snowflake", "Databricks", "Shopify", "Spotify", "TikTok",
  "ByteDance", "xAI", "Palantir", "Broadcom", "TSMC", "Samsung", "Qualcomm", "SAP", "ServiceNow", "Workday", "DoorDash", "Instacart",
]);
const TECH_WORDS = rx(["tech", "startup", "startups", "software", "chipmaker", "chips", "semiconductor", "app", "cloud", "big tech", "silicon valley", "saas"]);
const AI = rx(["AI", "artificial intelligence", "generative AI", "genAI", "LLM", "chatbot", "agents", "agentic", "machine learning", "data center", "data centers"]);
const HIRING = rx([
  "hiring", "hires", "hire", "layoffs", "layoff", "job cuts", "cuts jobs", "cut jobs", "headcount", "workforce", "graduates", "MBA", "MBAs",
  "campus", "interns", "internship", "return to office", "return-to-office", "recruiting", "recruitment", "talent", "compensation", "salaries",
  "promotions", "H-1B", "entry-level", "job market", "white-collar", "chief people officer",
]);
// People moves at consulting firms (only applied to consulting stories: "adds" is too generic elsewhere).
const FIRM_MOVES = rx(["adds", "appoints", "names", "named", "joins", "hires", "promotes", "promoted", "new partners", "managing director", "managing directors", "partner class"]);
const MA = rx(["buy", "buys", "to buy", "acquire", "acquires", "acquired", "acquisition", "acquisitions", "merger", "merge", "merges", "buyout", "takeover", "bid", "stake", "deal", "IPO", "spinoff", "spin off", "spins off", "breakup", "private equity", "divest", "divestiture"]);
const STRATEGY = rx([
  "strategy", "expands", "expansion", "enters", "entry", "launch", "launches", "pricing", "price increase", "price cuts", "raises prices", "tariff",
  "tariffs", "battle", "rivals", "takes on", "compete", "capacity", "double", "doubles", "low prices", "restructuring", "restructure", "turnaround", "bankruptcy", "chapter 11", "cost cuts", "cost-cutting", "antitrust", "reorganization", "overhaul", "pivot",
]);
const EARNINGS = rx(["earnings", "quarterly profit", "quarterly results", "revenue", "sales rose", "sales fell", "guidance", "outlook", "forecast", "profit warning", "beats", "misses"]);

const CONSUMER = rx([
  "consumer", "consumers", "shoppers", "shopping", "retail", "retailer", "retailers", "grocery", "grocer", "supermarket", "restaurant", "restaurants",
  "fast food", "fast-food", "menu prices", "grocery prices", "consumer prices", "inflation", "consumer spending", "same-store sales", "e-commerce", "Black Friday",
  "holiday sales", "Walmart", "Target", "Costco", "Kroger", "Amazon", "McDonald's", "Starbucks", "Chipotle", "Procter & Gamble", "PepsiCo", "Coca-Cola",
  "Nike", "Lululemon", "Home Depot", "CVS", "Walgreens", "Dollar General", "Dollar Tree", "Kraft Heinz", "Unilever", "Nestlé", "Shein", "Temu", "TJX",
  "Etsy", "Wayfair", "DoorDash", "Instacart", "Uber Eats", "subscription", "subscriptions", "GLP-1", "Ozempic", "Wegovy", "cruise", "airline fares", "hotel",
]);

export function tagItem(i: NewsItem): Tag[] {
  const t = `${i.title} ${i.summary}`;
  const tags: Tag[] = [];
  const consulting = i.source === "Consulting.us" || CONSULTING_FIRMS.test(t) || BAIN_ALONE.test(t) || CONSULTING_WORDS.test(i.title);
  const tech = i.source === "TechCrunch" || i.section === "Tech" || TECH_COS.test(i.title) || TECH_WORDS.test(i.title);
  if (consulting) tags.push("Consulting");
  if (tech) tags.push("Tech");
  if ((HIRING.test(i.title) && (consulting || tech || /\bMBA|graduates|entry-level|job market|white-collar/i.test(t))) || (consulting && FIRM_MOVES.test(i.title)))
    tags.push("Hiring & jobs");
  if (MA.test(i.title)) tags.push("M&A");
  if (STRATEGY.test(i.title) || (!MA.test(i.title) && STRATEGY.test(i.summary))) tags.push("Strategy");
  if (EARNINGS.test(i.title)) tags.push("Earnings");
  if (AI.test(i.title)) tags.push("AI");
  if (CONSUMER.test(i.title) || (i.section === "Business" && CONSUMER.test(i.summary))) tags.push("Consumer");
  return tags;
}

const WEIGHT: Record<Tag, number> = { Consulting: 3, Tech: 2, "Hiring & jobs": 3, "M&A": 2, Strategy: 1.5, Earnings: 1, AI: 1, Consumer: 1 };

function whyItMatters(tags: Tag[], title: string): Ranked["why"] {
  if (tags.includes("Hiring & jobs") && tags.includes("Consulting")) return { text: "Recruiting signal for consulting: worth knowing before coffee chats and fit interviews." };
  if (tags.includes("Hiring & jobs") && tags.includes("Tech")) return { text: "Recruiting signal for tech: shapes headcount and the roles firms are hiring for." };
  if (tags.includes("M&A")) return { text: /\bIPO\b|listing/i.test(title) ? "Case-ready: why raise money now, and what is the business worth?" : "Case-ready deal: what's the logic, is the price right, and what are the risks?", framework: /\bIPO\b|listing/i.test(title) ? "investment-npv" : "mergers-acquisitions" };
  if (tags.includes("Consulting")) return { text: "Consulting world: good material for coffee chats and 'why consulting?' answers." };
  if (tags.includes("Strategy") && /pric|tariff/i.test(title)) return { text: "Case-ready pricing question.", framework: "pricing" };
  if (tags.includes("Strategy")) return { text: "Case-ready: what's the strategic logic, and would you have done it?", framework: "growth-strategy" };
  if (tags.includes("Earnings")) return { text: "Profitability practice: what drove the change, revenue or cost?", framework: "profitability" };
  if (tags.includes("AI")) return { text: "Have a point of view: who captures value from AI in this industry?" };
  if (tags.includes("Consumer")) return { text: "US consumer signal: what does this say about how Americans are spending right now?" };
  return undefined;
}

/** Score = relevance weights × recency (half-life about 2 days). Items older than 14 days are dropped. */
export function rank(items: NewsItem[], now = Date.now()): Ranked[] {
  const out: Ranked[] = [];
  for (const i of items) {
    // Opinion columns and roundup digests aren't case material.
    if (/^opinion\b|roundup: market talk|^(?:what's news|the morning)/i.test(i.title)) continue;
    const ageH = (now - new Date(i.published).getTime()) / 3_600_000;
    if (!(ageH < 24 * 14)) continue;
    const tags = tagItem(i);
    let rel = tags.reduce((s, t) => s + WEIGHT[t], 0);
    if (i.source === "WSJ") rel += 0.5;
    const score = rel * Math.pow(0.5, Math.max(0, ageH) / 48);
    out.push({ ...i, tags, score, why: whyItMatters(tags, i.title) });
  }
  return out.sort((a, b) => b.score - a.score);
}

export function byLens(ranked: Ranked[], lens: Lens): Ranked[] {
  const f =
    lens === "consulting" ? (r: Ranked) => r.tags.includes("Consulting")
    : lens === "tech" ? (r: Ranked) => r.tags.includes("Tech")
    : lens === "deals" ? (r: Ranked) => r.tags.includes("M&A") || r.tags.includes("Strategy")
    : lens === "consumer" ? (r: Ranked) => r.tags.includes("Consumer")
    : (r: Ranked) => r.tags.length > 0;
  return ranked.filter(f);
}

/** Stories matching an industry's keywords or companies, most relevant and recent first. */
export function forIndustry(items: NewsItem[], news: { keywords: string[]; companies: string[] }, n = 8, now = Date.now()): Ranked[] {
  const kw = news.keywords.length ? rx(news.keywords) : null;
  const co = news.companies.length ? rx(news.companies) : null;
  return rank(items, now)
    .map((r) => {
      const t = `${r.title} ${r.summary}`;
      const hits = (co && co.test(r.title) ? 3 : co && co.test(t) ? 2 : 0) + (kw && kw.test(r.title) ? 2 : kw && kw.test(t) ? 1 : 0);
      const ageH = (now - new Date(r.published).getTime()) / 3_600_000;
      return { r, s: hits ? hits * Math.pow(0.5, Math.max(0, ageH) / 96) + r.score * 0.1 : 0 };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => x.r);
}
