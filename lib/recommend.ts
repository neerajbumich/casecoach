import "server-only";
import { getIndex, type CaseIndexEntry } from "@/lib/cases";
import { DIMENSIONS, averageScores, type DimensionKey, type SessionRecord } from "@/lib/scoring";

export type Recommendation = { dimension: DimensionKey; label: string; avg: number; why: string; caseEntry: CaseIndexEntry } | null;

const FIT: Record<DimensionKey, (c: CaseIndexEntry) => boolean> = {
  structure: (c) => c.format === "candidate-led",
  hypothesis: (c) => c.format === "candidate-led",
  quant: (c) => c.quant_intensity === "H",
  exhibits: (c) => c.exhibits >= 2,
  creativity: (c) => c.case_type.some((t) => t === "Market Entry" || t === "New Product/GTM" || t === "Growth/Revenue"),
  synthesis: (c) => c.format === "interviewer-led",
  communication: (c) => c.format === "interviewer-led",
};
const WHY: Record<DimensionKey, string> = {
  structure: "It's candidate-led, so you have to drive the structure yourself.",
  hypothesis: "It's candidate-led and rewards stating a hypothesis early.",
  quant: "It's quant-heavy: multi-step setup and arithmetic.",
  exhibits: "It has several exhibits to interpret.",
  creativity: "It leans on brainstorming.",
  synthesis: "It's interviewer-led and ends with a timed recommendation.",
  communication: "It's interviewer-led: crisp answers to direct questions.",
};

/** Weakest dimension over the last 10 sessions → an unpracticed case that trains it. */
export function recommendNext(sessions: SessionRecord[], solved: Set<string>): Recommendation {
  if (!sessions.length) return null;
  const avg = averageScores(sessions);
  const ranked = DIMENSIONS.filter((d) => avg[d.key] != null).sort((a, b) => (avg[a.key] as number) - (avg[b.key] as number));
  const done = new Set(sessions.map((s) => s.case_id));
  for (const d of ranked) {
    const pool = getIndex().filter((c) => FIT[d.key](c) && !done.has(c.id) && !solved.has(c.id));
    if (!pool.length) continue;
    // Prefer difficulty 3 first (stretch without drowning), then newer books.
    pool.sort((a, b) => Math.abs(a.difficulty - 3) - Math.abs(b.difficulty - 3) || b.year - a.year);
    return { dimension: d.key, label: d.label, avg: avg[d.key] as number, why: WHY[d.key], caseEntry: pool[0] };
  }
  return null;
}
