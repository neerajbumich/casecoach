import "server-only";
import { MODELS, PRICING } from "@/lib/config/models";
import { llmEnabled, monthlyCapUsd } from "@/lib/llm-config";
import { getStore } from "@/lib/store";

// Minimal Anthropic Messages API client (fetch, no SDK). The API key stays on the server.

export type Msg = { role: "user" | "assistant"; content: string };
export class LlmError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

// Per-instance rate limit: 12 calls per user per minute.
const hits = new Map<string, number[]>();
function rateLimit(key: string, max = 12, windowMs = 60_000) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) throw new LlmError("Slow down: too many requests this minute.", 429);
  arr.push(now);
  hits.set(key, arr);
}

function cost(model: string, u: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number }) {
  const p = PRICING[model] ?? { input: 15, output: 75 };
  const input = u.input_tokens + (u.cache_creation_input_tokens ?? 0) * 1.25 + (u.cache_read_input_tokens ?? 0) * 0.1;
  return (input * p.input + u.output_tokens * p.output) / 1_000_000;
}

export async function chat(opts: { userKey: string; system: string; messages: Msg[]; maxTokens?: number; model?: string }) {
  if (!llmEnabled()) throw new LlmError("The in-app interviewer is off (no API key or spend cap).", 403);
  rateLimit(opts.userKey);
  const store = getStore();
  const spent = await store.llmSpendThisMonth();
  const cap = monthlyCapUsd();
  if (spent >= cap) throw new LlmError(`Monthly spend cap reached ($${spent.toFixed(2)} of $${cap}). Use the Claude-app handoff instead.`, 402);

  const model = opts.model ?? MODELS.interviewer;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 1024,
      // The long case prompt is identical every turn, so cache it: later turns read it at a fraction of the price.
      system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
      messages: opts.messages,
    }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new LlmError(j?.error?.message ?? `Anthropic API error ${res.status}`, 502);
  const text = (j.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
  const c = cost(model, j.usage ?? { input_tokens: 0, output_tokens: 0 });
  await store.recordLlmUsage({ model, input_tokens: j.usage?.input_tokens ?? 0, output_tokens: j.usage?.output_tokens ?? 0, cost_usd: c });
  return { text, costUsd: c, spentUsd: spent + c, capUsd: cap };
}
