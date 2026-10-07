// Single place to swap models. Server-only: never import this from a client component.
export const MODELS = {
  interviewer: "claude-fable-5-1", // live case interviewer + post-case feedback
  extraction: "claude-sonnet-5", // bulk case-book extraction / tagging
  classify: "claude-haiku-4-5-20251001", // cheap classification
} as const;

export type ModelRole = keyof typeof MODELS;

// USD per million tokens (Anthropic pricing page, checked 2026-09-28). Used for the monthly spend cap.
// Cached prompt reads are billed at ~10% of input; we conservatively count them at 10% here.
export const PRICING: Record<string, { input: number; output: number }> = {
  "claude-fable-5-1": { input: 10, output: 50 },
  "claude-opus-5-5": { input: 4, output: 20 },
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
};
