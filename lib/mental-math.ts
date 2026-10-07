// Mental math problem generator and answer checker (pure; runs in the browser).
// Problem types mirror what shows up in case interviews.

export type MathType = "multiply" | "divide" | "percent-of" | "percent-change" | "fraction" | "breakeven" | "growth" | "big-units";
export type Problem = { id: string; type: MathType; prompt: string; answer: number; unit: "" | "%" | "$" | "units" | "years"; tolerance: number; hint: string };

export const TYPES: { key: MathType; label: string }[] = [
  { key: "multiply", label: "Multiplication" },
  { key: "divide", label: "Division" },
  { key: "percent-of", label: "Percent of" },
  { key: "percent-change", label: "Percent change" },
  { key: "fraction", label: "Fractions ↔ %" },
  { key: "breakeven", label: "Breakeven" },
  { key: "growth", label: "Growth & CAGR" },
  { key: "big-units", label: "Big numbers (K/M/B)" },
];

type Rng = () => number;
export function rngFrom(seed: number): Rng {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}
const pick = <T,>(r: Rng, xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
const int = (r: Rng, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));

export function fmt(n: number, unit: Problem["unit"] = ""): string {
  const abs = Math.abs(n);
  const s =
    abs >= 1e9 ? `${+(n / 1e9).toFixed(2)}B` : abs >= 1e6 ? `${+(n / 1e6).toFixed(2)}M` : abs >= 1e4 ? `${+(n / 1e3).toFixed(1)}K` : `${+n.toFixed(2)}`;
  return unit === "$" ? `$${s}` : unit === "%" ? `${+n.toFixed(2)}%` : unit === "years" ? `${+n.toFixed(1)} years` : s;
}

function make(type: MathType, r: Rng): Omit<Problem, "id"> {
  switch (type) {
    case "multiply": {
      const a = pick(r, [12, 15, 18, 24, 25, 35, 45, 64, 75, 85, 120, 250]);
      const b = pick(r, [6, 8, 12, 14, 16, 22, 32, 48, 60, 150]) * pick(r, [1, 10, 100, 1000]);
      return { type, prompt: `${a} × ${b.toLocaleString("en-US")}`, answer: a * b, unit: "", tolerance: 0, hint: "Split one factor: e.g. 25 × 48 = 25 × 4 × 12 = 1,200." };
    }
    case "divide": {
      const b = pick(r, [4, 8, 12, 15, 25, 40, 60, 75, 120]);
      const q = int(r, 3, 60) * pick(r, [1, 10, 100]);
      return { type, prompt: `${(b * q).toLocaleString("en-US")} ÷ ${b}`, answer: q, unit: "", tolerance: 0, hint: "Simplify both sides first (divide by 5 or 10), then divide." };
    }
    case "percent-of": {
      const p = pick(r, [5, 12.5, 15, 17.5, 22, 35, 37.5, 45, 62.5, 80]);
      const base = int(r, 2, 90) * pick(r, [1e3, 1e4, 1e5, 1e6]);
      return { type, prompt: `${p}% of ${fmt(base, "$")}`, answer: (p / 100) * base, unit: "$", tolerance: 0.005, hint: "Break the % apart: 37.5% = 25% + 12.5% (¼ + ⅛)." };
    }
    case "percent-change": {
      const from = int(r, 20, 400) * pick(r, [1, 10]);
      const pct = pick(r, [-40, -25, -12.5, -8, 5, 10, 15, 20, 33, 60]);
      const to = Math.round(from * (1 + pct / 100));
      const ans = ((to - from) / from) * 100;
      return { type, prompt: `Revenue went from $${from}M to $${to}M. Percent change?`, answer: ans, unit: "%", tolerance: 0.02, hint: "(new − old) ÷ old. Estimate the fraction, then convert to %." };
    }
    case "fraction": {
      const fr = pick(r, [[1, 8], [3, 8], [5, 8], [7, 8], [1, 6], [5, 6], [1, 7], [2, 7], [1, 9], [4, 9], [1, 12], [1, 11], [1, 16], [3, 16]] as const);
      return { type, prompt: `${fr[0]}/${fr[1]} as a percentage`, answer: (fr[0] / fr[1]) * 100, unit: "%", tolerance: 0.01, hint: "Memorise eighths (12.5%), sixths (16.7%), sevenths (14.3%), ninths (11.1%)." };
    }
    case "breakeven": {
      const price = pick(r, [8, 12, 20, 25, 40, 50, 80, 120]);
      const cm = pick(r, [0.2, 0.25, 0.3, 0.4, 0.5, 0.6]) * price;
      const units = int(r, 2, 40) * pick(r, [1e3, 1e4]);
      const fixed = cm * units;
      return { type, prompt: `Price $${price}, variable cost $${+(price - cm).toFixed(2)} per unit, fixed costs ${fmt(fixed, "$")}. Breakeven units?`, answer: units, unit: "units", tolerance: 0.01, hint: "Breakeven = fixed costs ÷ (price − variable cost)." };
    }
    case "growth": {
      if (r() < 0.5) {
        const g = pick(r, [3, 4, 6, 8, 9, 12, 18, 24]);
        return { type, prompt: `At ${g}% annual growth, roughly how many years to double?`, answer: 72 / g, unit: "years", tolerance: 0.1, hint: "Rule of 72: years ≈ 72 ÷ growth rate." };
      }
      const start = int(r, 10, 90) * 10;
      const g = pick(r, [5, 10, 15, 20]);
      const yrs = pick(r, [2, 3]);
      return { type, prompt: `$${start}M growing ${g}% a year for ${yrs} years. Ending value ($M)?`, answer: start * Math.pow(1 + g / 100, yrs), unit: "$", tolerance: 0.02, hint: "Compound step by step (add the % each year), don't just multiply g × years." };
    }
    case "big-units": {
      const a = int(r, 2, 40) * pick(r, [1e3, 1e6]);
      const b = int(r, 2, 60) * pick(r, [1e3, 1e5, 1e6]);
      const op = r() < 0.6 ? "×" : "÷";
      if (op === "×") return { type, prompt: `${fmt(a)} × ${fmt(b)}`, answer: a * b, unit: "", tolerance: 0.005, hint: "Multiply the digits, then add the zeros: K × M = B." };
      const big = a * b;
      return { type, prompt: `${fmt(big)} ÷ ${fmt(a)}`, answer: b, unit: "", tolerance: 0.005, hint: "Cancel zeros first: B ÷ K = M." };
    }
  }
}

export function makeSet(types: MathType[], n: number, seed = Date.now()): Problem[] {
  const r = rngFrom(seed);
  return Array.from({ length: n }, (_, i) => ({ id: `${seed}-${i}`, ...make(types[i % types.length], r) })).sort(() => r() - 0.5);
}

/** Parses "1,200", "1.2k", "$4.5M", "12.5%", "3.2 bn", "9 years" into a number (percent stays as its number). */
export function parseAnswer(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/[$,\s]/g, "").replace(/years?|yrs?|units?/g, "");
  const m = s.match(/^(-?\d*\.?\d+)(k|thousand|m|mm|mn|million|b|bn|billion|t|trillion)?%?$/);
  if (!m) return null;
  const mult: Record<string, number> = { k: 1e3, thousand: 1e3, m: 1e6, mm: 1e6, mn: 1e6, million: 1e6, b: 1e9, bn: 1e9, billion: 1e9, t: 1e12, trillion: 1e12 };
  return Number(m[1]) * (m[2] ? mult[m[2]] : 1);
}

export function isCorrect(p: Problem, raw: string): boolean {
  let v = parseAnswer(raw);
  if (v === null) return false;
  // "Ending value ($M)?": accept both "727" and "$727M".
  if (p.prompt.includes("($M)") && Math.abs(v) >= 1e5) v = v / 1e6;
  if (p.tolerance === 0) return Math.abs(v - p.answer) < 1e-9 * Math.max(1, Math.abs(p.answer)) + 1e-9;
  const tol = Math.max(p.tolerance * Math.abs(p.answer), p.unit === "%" ? 0.15 : 0);
  return Math.abs(v - p.answer) <= tol;
}
