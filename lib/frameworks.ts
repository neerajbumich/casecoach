import "server-only";
import frameworks from "@/data/frameworks.json";
import map from "@/data/framework-map.json";
import { getIndex, type CaseIndexEntry } from "@/lib/cases";

export type FwNode = { label: string; children?: FwNode[] };
export type Framework = {
  id: string;
  name: string;
  category: "core" | "tool";
  summary: string;
  opening_line: string;
  when_to_use: string[];
  when_not_to_use: string[];
  tree: FwNode;
  buckets: { name: string; questions: string[]; data_to_ask: string[] }[];
  industry_adaptations: { industry: string; note: string }[];
  common_mistakes: string[];
  related: string[];
  match: { case_types: string[]; tags: string[]; keywords: string[] };
};

const FW = frameworks as Framework[];
const MAP = map as { byCase: Record<string, string[]>; byFramework: Record<string, string[]> };

export function listFrameworks(): (Framework & { caseCount: number })[] {
  return FW.map((f) => ({ ...f, caseCount: MAP.byFramework[f.id]?.length ?? 0 }));
}
export function getFramework(id: string): Framework | undefined {
  return FW.find((f) => f.id === id);
}
export function casesForFramework(id: string): CaseIndexEntry[] {
  const idx = new Map(getIndex().map((c) => [c.id, c]));
  return (MAP.byFramework[id] ?? []).map((cid) => idx.get(cid)).filter((c): c is CaseIndexEntry => !!c);
}
export function frameworksForCase(caseId: string): { id: string; name: string }[] {
  return (MAP.byCase[caseId] ?? []).map((id) => getFramework(id)).filter((f): f is Framework => !!f).map((f) => ({ id: f.id, name: f.name }));
}

/** Picks the canonical frameworks most relevant to a free-text case prompt (for the coach). */
export function frameworksForText(text: string, n = 3): Framework[] {
  const t = text.toLowerCase();
  return FW.map((f) => ({ f, s: f.match.keywords.filter((k) => t.includes(k)).length * 2 + f.match.tags.filter((k) => t.includes(k.replace(/-/g, " "))).length }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => x.f);
}
