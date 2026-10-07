// CaseCoach — case record schema (Phase 1 extraction target)
// One record per case per source book. Duplicates across books are linked via variant_group_id.
// This file becomes /lib/schema/case.ts in the app; a matching Zod schema validates every LLM output.

export const CASE_TYPES = [
  "Profitability", "Market Entry", "Growth/Revenue", "M&A/Acquisition", "Pricing",
  "New Product/GTM", "Cost Reduction/Operations", "Market Sizing/Guesstimate",
  "Investment/PE due diligence", "Turnaround", "Competitive Response",
  "Capacity/Supply Chain", "Public Sector/Social Impact", "Other",
] as const;
export type CaseType = (typeof CASE_TYPES)[number];

export type Confidence = "high" | "medium" | "low";

export interface CaseRecord {
  // ── Identity & provenance ────────────────────────────────────────────
  id: string;                    // "kellogg-2024-avalon" (school-edition-slug)
  title: string;                 // "Avalon"
  school: string;                // "Kellogg"
  edition: string;               // "2024", "2021-22 (ed.2)" — academic year as printed on the cover
  year: number;                  // 2024 — first year of the edition, for sorting/filtering
  source_file: string;           // "Kellogg/Casebook_Kellogg_24.pdf"
  page_range: [number, number];  // PDF page numbers (1-based), e.g. [65, 74]
  author?: string;               // case writer if printed
  variant_group_id: string;      // same value for the same case in other books (see dedup)
  is_canonical_variant: boolean; // the most complete/recent version in the group

  // ── Classification ───────────────────────────────────────────────────
  case_type: CaseType[];         // multi-select, primary first
  case_type_source_label?: string; // what the book called it, e.g. "Opportunity Assessment"
  industry: string;              // level-1 slug from taxonomy, e.g. "utilities"
  sub_industry?: string;         // level-2 slug, e.g. "power-generation"
  industry_source_label?: string;// "Energy, Utilities & Mining"
  geography?: string;            // "US", "India", "Fictional country" …
  client_type?: "for-profit" | "PE/investor" | "public sector" | "non-profit";
  format: "interviewer-led" | "candidate-led" | "unspecified";
  firm_style_hint?: string[];    // e.g. ["McKinsey"] if the book says "McKinsey-style"
  difficulty: 1 | 2 | 3 | 4 | 5;
  difficulty_inferred: boolean;  // false = book's own rating (normalized to 1–5)
  difficulty_source_label?: string; // "Medium", "3/5", "Hard" …
  quant_intensity: "L" | "M" | "H";
  estimated_minutes: number;
  tags: string[];                // "breakeven", "NPV", "customer segmentation", "capacity"…
  concepts_tested?: string[];

  // ── Case content (verbatim-ish; light cleanup only) ────────────────────
  fit_question?: string;         // some books pair a fit question with each case
  prompt: string;                // the question read to the candidate
  clarifying_info: QA[];         // info released only if asked
  interviewer_notes: string;     // overall guide: what the case tests, how to run it
  suggested_framework: Framework;

  // Ordered stages — this is what powers the AI interviewer in Phase 3.
  // Each stage says what the interviewer asks, what data it may release and when,
  // and what a correct answer looks like.
  stages: Stage[];

  exhibits: Exhibit[];
  math: MathStep[];
  synthesis: string;             // sample recommendation
  what_great_looks_like: string[];
  common_pitfalls: string[];
  follow_ups?: string[];         // bonus / "if time permits" questions

  // ── Extraction quality ────────────────────────────────────────────────
  extraction: {
    model: string;                // e.g. "claude-sonnet-5"
    extracted_at: string;         // ISO date
    confidence: Confidence;
    low_confidence_fields: string[]; // e.g. ["exhibits[1].data", "math[2].answer"]
    math_verified: boolean;       // answers recomputed independently and matched
    notes?: string;               // anything odd (missing pages, answer key absent…)
    fields_inferred: string[];    // fields written by the model, not present in the book
  };
}

export interface QA { question_topic: string; answer: string; }

export interface Framework {
  summary: string;               // one-line description
  tree: FrameworkNode;           // renders as a visual tree
  canonical_framework_ids?: string[]; // links to Phase 4 repository (filled later)
}
export interface FrameworkNode { label: string; children?: FrameworkNode[]; }

export interface Stage {
  order: number;
  kind: "structure" | "clarify" | "analysis" | "exhibit" | "math" | "brainstorm" | "synthesis" | "market-sizing";
  interviewer_asks: string;      // what the interviewer says/asks
  release_when?: string;         // "Only after candidate asks about costs"
  info_to_release?: string;
  exhibit_ids?: string[];
  expected_answer: string;       // answer key — NEVER shown to the candidate in interview mode
  good_answer_signals?: string[];
}

export interface Exhibit {
  id: string;                    // "ex1"
  title: string;
  page: number;
  kind: "table" | "bar" | "line" | "pie" | "waterfall" | "text" | "other";
  description: string;           // what the chart shows, in words
  data?: { columns: string[]; rows: (string | number)[][] }; // transcribed values when legible
  image_path?: string;           // private storage path, e.g. "exhibits/kellogg-2024-avalon/ex1.webp"
  image_has_answers?: boolean;   // the page image also shows interviewer notes/answers: never show it in practice mode
  key_insight: string;           // what the candidate should notice
  data_confidence: Confidence;
}

export interface MathStep {
  id: string;
  question: string;              // "What is the annual breakeven volume?"
  givens: string[];
  steps: string[];               // worked solution
  answer: string;                // "12,500 units"
  answer_value?: number;         // numeric, for auto-checking candidate answers
  unit?: string;
  verified: boolean;             // our recomputation matched the book
  book_answer_if_different?: string; // flag book errors instead of silently fixing
}

// ── Non-case content captured in the same pass (feeds Phases 4 & 5) ──────
export interface SourceSection {
  id: string;
  source_file: string;
  page_range: [number, number];
  kind: "framework" | "industry-primer" | "tips-communication" | "math-tips" | "fit" | "firm-overview" | "other";
  title: string;
  text: string;
}
