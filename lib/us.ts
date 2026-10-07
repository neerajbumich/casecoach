import "server-only";
import us from "@/data/us.json";

export type Block =
  | { type: "text"; title?: string; body: string }
  | { type: "list"; title: string; items: string[] }
  | { type: "table"; title: string; columns: string[]; rows: string[][]; note?: string }
  | { type: "callout"; tone: "tip" | "watch"; title: string; body: string }
  | { type: "compare"; title: string; left: string; right: string; rows: [string, string, string][] };

export type Chapter = {
  id: string;
  section: "consumer" | "business" | "culture";
  order: number;
  title: string;
  summary: string;
  blocks: Block[];
  in_a_case: string[];
  flashcards: { front: string; back: string }[];
  sources: string[];
  checked: string;
};
export type Anchor = { id: string; category: string; label: string; value: string; interview_value: string; note: string; source: string; year: number };

const DATA = us as unknown as { chapters: Chapter[]; anchors: Anchor[] };

export const SECTIONS: { id: Chapter["section"]; title: string; blurb: string }[] = [
  { id: "consumer", title: "The US consumer", blurb: "How Americans shop, spend and live: the context retail, CPG and restaurant cases assume." },
  { id: "business", title: "US business context", blurb: "How US companies, healthcare, government and labor markets work." },
  { id: "culture", title: "Interview & networking culture", blurb: "Small talk, self-promotion, directness and networking norms." },
];

export const listChapters = () => DATA.chapters;
export const getChapter = (id: string) => DATA.chapters.find((c) => c.id === id);
export const listAnchors = () => DATA.anchors;

/** US Playbook chapters most relevant to an industry primer. */
const BY_INDUSTRY: Record<string, string[]> = {
  retail: ["how-americans-shop", "retail-calendar", "consumer-trends"],
  ecommerce: ["how-americans-shop", "retail-calendar", "consumer-trends"],
  cpg: ["how-americans-shop", "consumer-trends", "american-brands"],
  restaurants: ["consumer-trends", "regions-and-geography", "american-brands"],
  "food-delivery-quick-commerce": ["india-vs-us-consumer", "regions-and-geography", "consumer-trends"],
  beauty: ["generations", "consumer-trends"],
  luxury: ["income-and-demographics", "generations"],
  "payments-fintech": ["income-and-demographics", "india-vs-us-consumer"],
  banking: ["income-and-demographics", "how-us-companies-work"],
  "healthcare-providers": ["us-healthcare-map"],
  "health-insurance": ["us-healthcare-map"],
  pharma: ["us-healthcare-map"],
  biotech: ["us-healthcare-map"],
  medtech: ["us-healthcare-map"],
  "public-sector": ["government-and-regulation"],
  education: ["government-and-regulation"],
  "asset-management-pe": ["how-us-companies-work"],
  "automotive-ev": ["regions-and-geography", "labor-and-workplace"],
  airlines: ["labor-and-workplace", "retail-calendar"],
  hospitality: ["retail-calendar", "generations"],
};
export function chaptersForIndustry(industry: string): Chapter[] {
  return (BY_INDUSTRY[industry] ?? []).map(getChapter).filter((c): c is Chapter => !!c);
}
