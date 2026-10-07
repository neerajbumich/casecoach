import "server-only";
import library from "@/data/library.json";
import index from "@/data/library-index.json";
import type { CaseRecord } from "@/lib/schema/case";

// Case content is bundled into the server only. Pages pass data to the client
// per request, after requireUser() — it is never in a public file.

export type CaseIndexEntry = {
  id: string;
  title: string;
  school: string;
  edition: string;
  year: number;
  case_type: string[];
  industry: string;
  sub_industry: string | null;
  format: string;
  difficulty: number;
  difficulty_inferred: boolean;
  quant_intensity: "L" | "M" | "H";
  estimated_minutes: number;
  tags: string[];
  exhibits: number;
  math: number;
  confidence: string;
  teaser: string;
  firm: string;
};

const CASES = library as unknown as CaseRecord[];
const INDEX = index as CaseIndexEntry[];
const BY_ID = new Map(CASES.map((c) => [c.id, c]));

export function getIndex(): CaseIndexEntry[] {
  return INDEX;
}

export function getCase(id: string): CaseRecord | undefined {
  return BY_ID.get(id);
}

// Similar cases: shared case type (strongest), industry, tags, similar difficulty.
export function similarCases(id: string, n = 4): CaseIndexEntry[] {
  const me = INDEX.find((c) => c.id === id);
  if (!me) return [];
  const tags = new Set(me.tags);
  return INDEX.filter((c) => c.id !== id)
    .map((c) => {
      let s = 0;
      s += c.case_type.filter((t) => me.case_type.includes(t)).length * 3;
      if (c.case_type[0] === me.case_type[0]) s += 2;
      if (c.industry === me.industry) s += 3;
      s += c.tags.filter((t) => tags.has(t)).length;
      s -= Math.abs(c.difficulty - me.difficulty) * 0.5;
      return { c, s };
    })
    .filter((x) => x.s > 2)
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => x.c);
}
