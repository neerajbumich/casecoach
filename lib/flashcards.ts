import "server-only";
import { listFrameworks } from "@/lib/frameworks";
import { listIndustries } from "@/lib/industries";
import { MODULES } from "@/lib/communication";
import { listAnchors, listChapters } from "@/lib/us";

export type Card = { id: string; deck: DeckId; front: string; back: string; link?: string };
export type DeckId = "core" | "frameworks" | "metrics" | "communication" | "us" | "anchors";

export const DECKS: { id: DeckId; title: string; blurb: string }[] = [
  { id: "core", title: "Case math & finance", blurb: "Formulas, fraction–percent equivalents, definitions and sizing anchors." },
  { id: "frameworks", title: "Frameworks", blurb: "The branches and opening line of each framework." },
  { id: "metrics", title: "Industry metrics", blurb: "The KPIs interviewers expect you to know in each industry." },
  { id: "communication", title: "Communication rules", blurb: "The rule for each moment of the case." },
  { id: "us", title: "US Playbook", blurb: "US consumers, business, healthcare and interview culture." },
  { id: "anchors", title: "US sizing numbers", blurb: "The round US numbers to use in market sizing." },
];

// Core deck: stable ids (never renumber: progress is keyed by id).
const CORE: [string, string, string][] = [
  ["f-18", "1/8 as a %", "12.5%"],
  ["f-38", "3/8 as a %", "37.5%"],
  ["f-58", "5/8 as a %", "62.5%"],
  ["f-78", "7/8 as a %", "87.5%"],
  ["f-16", "1/6 as a %", "≈16.7%"],
  ["f-56", "5/6 as a %", "≈83.3%"],
  ["f-17", "1/7 as a %", "≈14.3%"],
  ["f-19", "1/9 as a %", "≈11.1%"],
  ["f-111", "1/11 as a %", "≈9.1%"],
  ["f-112", "1/12 as a %", "≈8.3%"],
  ["f-116", "1/16 as a %", "6.25%"],
  ["m-72", "Rule of 72", "Years to double ≈ 72 ÷ annual growth rate (in %). E.g. 8% → ~9 years."],
  ["m-cagr", "CAGR formula", "(End ÷ Start)^(1/years) − 1"],
  ["m-be", "Breakeven volume", "Fixed costs ÷ (price − variable cost per unit), i.e. fixed costs ÷ unit contribution margin."],
  ["m-cm", "Contribution margin", "Price − variable cost per unit (or as a % of price). What each unit contributes to fixed costs and profit."],
  ["m-profit", "Profit equation", "Profit = Revenue − Costs = (Price × Volume) − (Fixed costs + Variable cost × Volume)."],
  ["m-perp", "Value of a perpetuity", "Annual cash flow ÷ discount rate. E.g. $10M a year at 10% ≈ $100M."],
  ["m-gperp", "Value of a growing perpetuity", "Next year's cash flow ÷ (discount rate − growth rate)."],
  ["m-npv", "NPV decision rule", "Invest if the present value of future cash flows exceeds the upfront cost (NPV > 0)."],
  ["m-payback", "Payback period", "Upfront investment ÷ annual cash flow (simple, undiscounted)."],
  ["m-roi", "ROI", "(Gain − cost) ÷ cost."],
  ["m-moic", "MOIC", "Multiple on invested capital: total value returned ÷ equity invested. 2× in ~4-5 years is a common PE hurdle."],
  ["m-irr", "IRR", "The discount rate at which NPV = 0. Rough link to MOIC: 2× in 5 years ≈ 15% IRR; 3× in 5 years ≈ 25%."],
  ["m-ev", "Enterprise value vs equity value", "EV = equity value + net debt. EV/EBITDA values the whole business; P/E values equity."],
  ["m-ebitda", "EBITDA", "Earnings before interest, taxes, depreciation and amortization: a proxy for operating cash profit."],
  ["m-gm", "Gross margin", "(Revenue − COGS) ÷ revenue."],
  ["m-om", "Operating margin", "Operating profit (EBIT) ÷ revenue: after COGS and operating expenses (SG&A, R&D)."],
  ["m-fcf", "Free cash flow", "Operating cash flow − capex. Cash available to investors."],
  ["m-wc", "Working capital", "Current assets − current liabilities; in operations mostly receivables + inventory − payables."],
  ["m-elastic", "Price elasticity of demand", "% change in quantity ÷ % change in price. |E| > 1: elastic, so a price cut raises revenue."],
  ["m-ltv", "Customer lifetime value (simple)", "Annual margin per customer ÷ annual churn rate (or × expected lifetime in years)."],
  ["m-cac", "CAC and payback", "Customer acquisition cost = sales & marketing spend ÷ new customers. CAC payback = CAC ÷ monthly gross margin per customer."],
  ["m-share", "Market share vs relative market share", "Share = our sales ÷ market sales. Relative share = our share ÷ largest competitor's share."],
  ["m-mix", "Mix effect", "A change in the average (price, margin) caused by a shift in the proportion of products or customers, even if each one's value is unchanged."],
  ["m-fixed", "Operating leverage", "A high share of fixed costs makes profit swing more than revenue: volume changes hit the bottom line harder."],
  ["m-sunk", "Sunk cost", "Already spent and unrecoverable: ignore it in forward-looking decisions."],
  ["m-synergy", "Revenue vs cost synergies", "Cost synergies (overlap removal, scale buying) are more reliable than revenue synergies (cross-sell), which interviewers expect you to discount."],
  ["a-uspop", "US population (sizing anchor)", "~340M"],
  ["a-ushh", "US households (sizing anchor)", "~130M, about 2.5 people each"],
  ["a-usadult", "US adults (sizing anchor)", "~270M (about 79% of ~340M; older guides say 260M)"],
  ["a-life", "US life expectancy (sizing anchor)", "~79 years (use 80 in a case), so roughly 4M people per single year of age"],
  ["a-world", "World population (sizing anchor)", "~8B"],
  ["a-india", "India population (sizing anchor)", "~1.4B"],
  ["a-gdp", "US GDP (sizing anchor)", "~$28T"],
  ["a-days", "Working days a year (sizing anchor)", "~250 (52 weeks × 5 days, minus holidays)"],
  ["a-hours", "Working hours a year per full-time employee", "~2,000 (50 weeks × 40 hours)"],
  ["c-mece", "MECE", "Mutually exclusive, collectively exhaustive: buckets don't overlap and together cover the whole question."],
  ["c-hyp", "Hypothesis-driven", "State a testable best guess early, then pick the analysis that would prove or kill it."],
  ["c-8020", "80/20 in a case", "Spend time on the few drivers that explain most of the answer; say what you're deprioritising."],
];

const branches = (labels: { label: string }[]) => labels.map((b) => b.label).join(" · ");

export function buildDeck(): Card[] {
  const cards: Card[] = CORE.map(([id, front, back]) => ({ id: `core:${id}`, deck: "core", front, back }));
  for (const f of listFrameworks()) {
    cards.push({ id: `fw:${f.id}:branches`, deck: "frameworks", front: `${f.name}: the main branches?`, back: branches(f.tree.children ?? []), link: `/frameworks/${f.id}` });
    cards.push({ id: `fw:${f.id}:open`, deck: "frameworks", front: `${f.name}: how would you open with it?`, back: f.opening_line, link: `/frameworks/${f.id}` });
  }
  for (const ind of listIndustries()) {
    for (const m of ind.key_metrics) {
      const slug = m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      cards.push({ id: `ind:${ind.id}:${slug}`, deck: "metrics", front: `${ind.name}: ${m.name}`, back: m.what, link: `/industries/${ind.id}#metrics` });
    }
  }
  for (const m of MODULES) cards.push({ id: `comm:${m.id}`, deck: "communication", front: `${m.title}: the rule?`, back: m.principle, link: `/communication/${m.id}` });
  for (const ch of listChapters())
    ch.flashcards.forEach((f, i) => cards.push({ id: `us:${ch.id}:${i}`, deck: "us", front: f.front, back: f.back, link: `/us/${ch.id}` }));
  for (const a of listAnchors())
    cards.push({ id: `anchor:${a.id}`, deck: "anchors", front: `US: ${a.label}?`, back: `${a.interview_value} in a case (verified ${a.value}, ${a.year}). ${a.note}`, link: "/us/anchors" });
  return cards;
}
