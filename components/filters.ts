// Shared filter model for the library and dashboard (URL query params are the source of truth).
import type { CaseIndexEntry } from "@/lib/cases";

export type Filters = {
  q: string;
  type: string[];
  industry: string[];
  difficulty: string[];
  school: string[];
  year: string[];
  format: string[];
  quant: string[];
  status: string; // "" | "solved" | "unsolved"
  minex: number; // minimum number of exhibits (set by journal recommendations)
};

export const FILTER_KEYS = ["type", "industry", "difficulty", "school", "year", "format", "quant"] as const;

export function parseFilters(sp: URLSearchParams): Filters {
  const list = (k: string) => sp.getAll(k).flatMap((v) => v.split("|")).filter(Boolean);
  return {
    q: sp.get("q") ?? "",
    type: list("type"),
    industry: list("industry"),
    difficulty: list("difficulty"),
    school: list("school"),
    year: list("year"),
    format: list("format"),
    quant: list("quant"),
    status: sp.get("status") ?? "",
    minex: Number(sp.get("minex")) || 0,
  };
}

export function toQuery(f: Filters): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  for (const k of FILTER_KEYS) if (f[k].length) sp.set(k, f[k].join("|"));
  if (f.status) sp.set("status", f.status);
  if (f.minex) sp.set("minex", String(f.minex));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function matches(c: CaseIndexEntry, f: Filters, solved: (id: string) => boolean): boolean {
  if (f.type.length && !c.case_type.some((t) => f.type.includes(t))) return false;
  if (f.industry.length && !f.industry.includes(c.industry)) return false;
  if (f.difficulty.length && !f.difficulty.includes(String(c.difficulty))) return false;
  if (f.school.length && !f.school.includes(c.school)) return false;
  if (f.year.length && !f.year.includes(String(c.year))) return false;
  if (f.format.length && !f.format.includes(c.format)) return false;
  if (f.quant.length && !f.quant.includes(c.quant_intensity)) return false;
  if (f.minex && c.exhibits < f.minex) return false;
  if (f.status === "solved" && !solved(c.id)) return false;
  if (f.status === "unsolved" && solved(c.id)) return false;
  if (f.q) {
    const hay = `${c.title} ${c.school} ${c.teaser} ${c.tags.join(" ")} ${c.case_type.join(" ")} ${c.industry} ${c.sub_industry ?? ""} ${c.firm}`.toLowerCase();
    if (!f.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
  }
  return true;
}

export const EMPTY_FILTERS: Filters = { q: "", type: [], industry: [], difficulty: [], school: [], year: [], format: [], quant: [], status: "", minex: 0 };
