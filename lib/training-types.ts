// Shared shapes for Phase 7 per-user records (stored via /api/items/<kind>).

export type DrillResult = {
  drill: "math" | "sizing" | "structure" | "exhibit" | "synthesis" | "fit" | "flashcards";
  at: string;
  score: number; // 0..1
  n?: number;
  correct?: number;
  avg_sec?: number;
  by_type?: Record<string, { n: number; correct: number; sec: number }>;
  ref?: string; // market-sizing problem id, case id…
  label?: string;
};

export type SrsState = { ease: number; interval: number; due: string; reps: number; lapses: number; last?: string };

export type Story = {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  reflection: string;
  competencies: string[];
  updated: string;
};

export type MarketSizing = {
  id: string;
  question: string;
  difficulty: 1 | 2 | 3;
  unit: string;
  tags: string[];
  clarify: string[];
  approach: string[];
  assumptions: { label: string; value: string; why?: string }[];
  calc: string[];
  estimate: string;
  estimate_value: number;
  range: [number, number];
  sanity_check: string;
  so_what: string;
};
