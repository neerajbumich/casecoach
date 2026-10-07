import "server-only";
import firms from "@/data/firms.json";

export type Firm = {
  id: string;
  name: string;
  tier: "MBB" | "Big 4 strategy" | "Tier 2";
  one_liner: string;
  at_a_glance: string[];
  interview_process: { rounds: string[]; case_style: string; fit_style: string; assessments: string };
  what_they_look_for: string[];
  culture: string[];
  why_us_angles: string[];
  prep_tips: string[];
  practice_mode: "mckinsey" | "bcg" | "bain" | "tier2";
  sources: string[];
  checked: string;
};

const ALL = firms as Firm[];
const TIER_ORDER = ["MBB", "Big 4 strategy", "Tier 2"] as const;
const MBB_ORDER = ["mckinsey", "bcg", "bain"];

export function listFirms(): Firm[] {
  return [...ALL].sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier) || (MBB_ORDER.indexOf(a.id) + 1 || 99) - (MBB_ORDER.indexOf(b.id) + 1 || 99) || a.name.localeCompare(b.name));
}
export function getFirm(id: string): Firm | undefined {
  return ALL.find((f) => f.id === id);
}
export { TIER_ORDER };
