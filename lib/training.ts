import "server-only";
import { getIndex, type CaseIndexEntry } from "@/lib/cases";
import { DIMENSIONS, averageScores, type DimensionKey, type SessionRecord } from "@/lib/scoring";
import type { DrillResult, SrsState } from "@/lib/training-types";
import { isDue } from "@/lib/srs";

const FIT: Partial<Record<DimensionKey, (c: CaseIndexEntry) => boolean>> = {
  structure: (c) => c.format === "candidate-led",
  hypothesis: (c) => c.format === "candidate-led",
  quant: (c) => c.quant_intensity === "H",
  exhibits: (c) => c.exhibits >= 2,
  creativity: (c) => c.case_type.some((t) => ["Market Entry", "New Product/GTM", "Growth/Revenue"].includes(t)),
  synthesis: (c) => c.format === "interviewer-led",
  communication: (c) => c.format === "interviewer-led",
};

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
export const dayKey = (d = new Date(), tz = "America/Detroit") => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d); // YYYY-MM-DD

/** Same case all day; changes daily. Targets the weakest scorecard area when there is history, skips solved cases. */
export function caseOfTheDay(sessions: SessionRecord[], solved: Set<string>, day = dayKey()): { c: CaseIndexEntry; why: string } {
  const all = getIndex();
  const tried = new Set(sessions.map((s) => s.case_id));
  let pool = all.filter((c) => !solved.has(c.id) && !tried.has(c.id));
  if (!pool.length) pool = all;
  let why = "A fresh case you haven't done yet.";
  if (sessions.length) {
    const avg = averageScores(sessions);
    const weakest = DIMENSIONS.filter((d) => avg[d.key] != null).sort((a, b) => (avg[a.key] as number) - (avg[b.key] as number))[0];
    const fit = weakest && FIT[weakest.key];
    const targeted = fit ? pool.filter(fit) : [];
    if (targeted.length) {
      pool = targeted;
      why = `Targets your weakest area: ${weakest.label} (${avg[weakest.key]}/5).`;
    }
  }
  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id));
  return { c: sorted[hash(day) % sorted.length], why };
}

/** Days (in the user's timezone) with any practice activity: sessions or drills. */
export function activityDays(sessions: SessionRecord[], drills: DrillResult[]): Map<string, number> {
  const m = new Map<string, number>();
  const add = (iso: string) => {
    const k = dayKey(new Date(iso));
    m.set(k, (m.get(k) ?? 0) + 1);
  };
  sessions.forEach((s) => add(s.started_at));
  drills.forEach((d) => add(d.at));
  return m;
}

export function streak(days: Map<string, number>, today = dayKey()): number {
  let n = 0;
  const d = new Date(`${today}T12:00:00Z`);
  // Today not done yet doesn't break the streak.
  if (!days.has(today)) d.setUTCDate(d.getUTCDate() - 1);
  while (days.has(d.toISOString().slice(0, 10))) {
    n++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return n;
}

export function dueCards(srs: { key: string; data: SrsState }[], now = Date.now()) {
  return srs.filter((s) => isDue(s.data, now)).length;
}
