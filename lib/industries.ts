import "server-only";
import industries from "@/data/industries.json";
import { getIndex, type CaseIndexEntry } from "@/lib/cases";

export type Industry = {
  id: string;
  name: string;
  group: string;
  one_liner: string;
  how_it_makes_money: string;
  value_chain: string[];
  revenue_formula: string[];
  cost_structure: string[];
  margins: string;
  key_metrics: { name: string; what: string }[];
  trends: string[];
  key_players: string[];
  case_angles: { question: string; framework_id: string }[];
  interview_hooks: string[];
  news: { keywords: string[]; companies: string[] };
};

const ALL = industries as Industry[];
export const GROUP_ORDER = ["Tech & media", "Consumer & retail", "Financial services", "Healthcare", "Energy & resources", "Industrials", "Travel & transport", "Public & services"];

export function listIndustries(): (Industry & { caseCount: number })[] {
  const counts = new Map<string, number>();
  for (const c of getIndex()) counts.set(c.industry, (counts.get(c.industry) ?? 0) + 1);
  return ALL.map((i) => ({ ...i, caseCount: counts.get(i.id) ?? 0 }));
}
export function getIndustry(id: string): Industry | undefined {
  return ALL.find((i) => i.id === id);
}
export function casesForIndustry(id: string): CaseIndexEntry[] {
  return getIndex().filter((c) => c.industry === id);
}
