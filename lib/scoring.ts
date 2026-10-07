// Scorecard model shared by the Claude handoff, the in-app interviewer, the session log and the journal.
// No server-only imports here: the client uses it to parse pasted scorecards.

export const DIMENSIONS = [
  { key: "structure", label: "Structure / framework" },
  { key: "hypothesis", label: "Hypothesis-driven thinking" },
  { key: "quant", label: "Quant accuracy & speed" },
  { key: "exhibits", label: "Exhibit interpretation" },
  { key: "creativity", label: "Creativity / brainstorming" },
  { key: "synthesis", label: "Synthesis / recommendation" },
  { key: "communication", label: "Communication" },
] as const;
export type DimensionKey = (typeof DIMENSIONS)[number]["key"];

export const MISTAKE_CATEGORIES = [
  { key: "clarifying", label: "Clarifying questions" },
  { key: "structure", label: "Structure / MECE" },
  { key: "hypothesis", label: "No hypothesis / drifting" },
  { key: "math-setup", label: "Math setup" },
  { key: "math-arithmetic", label: "Arithmetic errors" },
  { key: "exhibit-reading", label: "Exhibit reading" },
  { key: "brainstorming", label: "Brainstorming" },
  { key: "business-judgment", label: "Business judgment / so-what" },
  { key: "synthesis", label: "Synthesis" },
  { key: "communication", label: "Communication / signposting" },
  { key: "time-management", label: "Time management" },
] as const;
export type MistakeCategory = (typeof MISTAKE_CATEGORIES)[number]["key"];

export const FIRM_MODES = [
  { key: "mckinsey", label: "McKinsey (interviewer-led)" },
  { key: "bcg", label: "BCG (candidate-led, conversational)" },
  { key: "bain", label: "Bain (candidate-led)" },
  { key: "tier2", label: "Deloitte / Tier 2" },
] as const;
export type FirmMode = (typeof FIRM_MODES)[number]["key"];

export type DimensionScore = { score: number; evidence: string[]; comment: string };
export type Scorecard = {
  version: 1;
  case_id: string;
  overall: number;
  scores: Record<DimensionKey, DimensionScore>;
  where_i_went_wrong: { moment: string; what_happened: string; better: string }[];
  mistakes: { category: MistakeCategory; description: string; quote?: string }[];
  framework_comparison: { mine: string; ideal: string; gap: string };
  alternative_frameworks: { name: string; why: string }[];
  drills: { title: string; how: string }[];
  hints_used: number;
  duration_minutes?: number;
};

export type SessionRecord = {
  id: string;
  case_id: string;
  case_title: string;
  firm_mode: FirmMode;
  source: "claude-handoff" | "in-app" | "partner";
  started_at: string;
  duration_min: number | null;
  hints_used: number;
  overall: number | null;
  scores: Partial<Record<DimensionKey, number>>;
  scorecard: Scorecard;
  transcript: string | null;
  notes: string | null;
};

export type MistakeRecord = {
  id: string;
  session_id: string;
  case_id: string;
  category: MistakeCategory;
  description: string;
  quote: string | null;
  created_at: string;
};

// The JSON shape Claude is asked to produce (kept here so prompts and parser stay in sync).
export const SCORECARD_TEMPLATE = `{
  "version": 1,
  "case_id": "<case id>",
  "overall": <1-5, may use .5>,
  "scores": {
${DIMENSIONS.map((d) => `    "${d.key}": { "score": <1-5>, "evidence": ["<exact quote(s) from the candidate>"], "comment": "<1-2 sentences>" }`).join(",\n")}
  },
  "where_i_went_wrong": [{ "moment": "<when>", "what_happened": "<what the candidate did>", "better": "<what a strong candidate would do>" }],
  "mistakes": [{ "category": "<one of: ${MISTAKE_CATEGORIES.map((c) => c.key).join(" | ")}>", "description": "<specific>", "quote": "<candidate's words>" }],
  "framework_comparison": { "mine": "<candidate's structure, summarized>", "ideal": "<ideal structure for this case>", "gap": "<what was missing or not MECE>" },
  "alternative_frameworks": [{ "name": "<framework>", "why": "<why it would also work here>" }],
  "drills": [{ "title": "<drill>", "how": "<exactly how to practice it>" }],
  "hints_used": <number>,
  "duration_minutes": <number>
}`;

const clamp = (n: unknown, lo = 1, hi = 5) => {
  const x = typeof n === "number" ? n : parseFloat(String(n));
  return Number.isFinite(x) ? Math.min(hi, Math.max(lo, Math.round(x * 2) / 2)) : NaN;
};
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Finds the scorecard JSON in pasted text (a ```json block or the last {...} object) and validates it. */
export function parseScorecard(text: string, caseId: string): { ok: true; card: Scorecard } | { ok: false; error: string } {
  const blocks = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)].map((m) => m[1]);
  let candidates = blocks.length ? blocks.reverse() : [];
  if (!candidates.length) {
    const start = text.indexOf("{"), end = text.lastIndexOf("}");
    if (start >= 0 && end > start) candidates = [text.slice(start, end + 1)];
  }
  let raw: Record<string, unknown> | null = null;
  for (const c of candidates) {
    try {
      const j = JSON.parse(c);
      if (j && typeof j === "object" && "scores" in j) { raw = j; break; }
    } catch {}
  }
  if (!raw) return { ok: false, error: "Couldn't find the scorecard JSON. Paste Claude's final message including the ```json block." };

  const scoresIn = (raw.scores ?? {}) as Record<string, unknown>;
  const scores = {} as Record<DimensionKey, DimensionScore>;
  for (const d of DIMENSIONS) {
    const s = scoresIn[d.key] as Record<string, unknown> | number | undefined;
    const score = clamp(typeof s === "object" && s ? s.score : s);
    if (!Number.isFinite(score)) return { ok: false, error: `Missing score for "${d.label}".` };
    scores[d.key] = {
      score,
      evidence: typeof s === "object" && s ? arr(s.evidence).map(str).filter(Boolean) : [],
      comment: typeof s === "object" && s ? str(s.comment) : "",
    };
  }
  const cats = new Set<string>(MISTAKE_CATEGORIES.map((c) => c.key));
  const mistakes = arr(raw.mistakes)
    .map((m) => m as Record<string, unknown>)
    .map((m) => ({ category: (cats.has(str(m.category)) ? str(m.category) : "business-judgment") as MistakeCategory, description: str(m.description), quote: str(m.quote) || undefined }))
    .filter((m) => m.description);
  const fc = (raw.framework_comparison ?? {}) as Record<string, unknown>;
  const avg = DIMENSIONS.reduce((s, d) => s + scores[d.key].score, 0) / DIMENSIONS.length;
  const overall = clamp(raw.overall);
  return {
    ok: true,
    card: {
      version: 1,
      case_id: str(raw.case_id) || caseId,
      overall: Number.isFinite(overall) ? overall : Math.round(avg * 2) / 2,
      scores,
      where_i_went_wrong: arr(raw.where_i_went_wrong).map((w) => w as Record<string, unknown>).map((w) => ({ moment: str(w.moment), what_happened: str(w.what_happened), better: str(w.better) })).filter((w) => w.what_happened),
      mistakes,
      framework_comparison: { mine: str(fc.mine), ideal: str(fc.ideal), gap: str(fc.gap) },
      alternative_frameworks: arr(raw.alternative_frameworks).map((a) => a as Record<string, unknown>).map((a) => ({ name: str(a.name), why: str(a.why) })).filter((a) => a.name),
      drills: arr(raw.drills).map((a) => a as Record<string, unknown>).map((a) => ({ title: str(a.title), how: str(a.how) })).filter((a) => a.title),
      hints_used: Math.max(0, Math.round(Number(raw.hints_used) || 0)),
      duration_minutes: Number(raw.duration_minutes) || undefined,
    },
  };
}

// ── Journal analytics ──────────────────────────────────────────────────────────
export type Trend = { category: MistakeCategory; label: string; total: number; earlier: number; recent: number; changePct: number | null };

/** Mistakes per session, earlier half vs recent half of the last `window` sessions. */
export function mistakeTrends(sessions: SessionRecord[], mistakes: MistakeRecord[], window = 10): Trend[] {
  const recentSessions = [...sessions].sort((a, b) => a.started_at.localeCompare(b.started_at)).slice(-window);
  const half = Math.floor(recentSessions.length / 2);
  const early = new Set(recentSessions.slice(0, half).map((s) => s.id));
  const late = new Set(recentSessions.slice(half).map((s) => s.id));
  return MISTAKE_CATEGORIES.map((c) => {
    const ms = mistakes.filter((m) => m.category === c.key);
    const e = early.size ? ms.filter((m) => early.has(m.session_id)).length / early.size : 0;
    const l = late.size ? ms.filter((m) => late.has(m.session_id)).length / late.size : 0;
    return { category: c.key, label: c.label, total: ms.length, earlier: e, recent: l, changePct: early.size && e > 0 ? Math.round(((l - e) / e) * 100) : null };
  }).filter((t) => t.total > 0).sort((a, b) => b.total - a.total);
}

export function averageScores(sessions: SessionRecord[], last = 10): Record<DimensionKey, number | null> {
  const s = [...sessions].sort((a, b) => b.started_at.localeCompare(a.started_at)).slice(0, last);
  const out = {} as Record<DimensionKey, number | null>;
  for (const d of DIMENSIONS) {
    const v = s.map((x) => x.scores[d.key]).filter((x): x is number => typeof x === "number");
    out[d.key] = v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
  }
  return out;
}

/** Library filters (URL query) that target a weak dimension. */
export const TARGETING: Record<DimensionKey, { why: string; query: string }> = {
  structure: { why: "candidate-led cases make you drive the structure", query: "format=candidate-led" },
  hypothesis: { why: "candidate-led cases reward an early hypothesis", query: "format=candidate-led" },
  quant: { why: "high-quant cases drill setup and arithmetic", query: "quant=H" },
  exhibits: { why: "exhibit-heavy cases train chart reading", query: "minex=2" },
  creativity: { why: "market entry and new-product cases lean on brainstorming", query: "type=Market%20Entry|New%20Product%2FGTM" },
  synthesis: { why: "interviewer-led cases end with a timed recommendation", query: "format=interviewer-led" },
  communication: { why: "interviewer-led cases test crisp answers to direct questions", query: "format=interviewer-led" },
};
