"use client";
import { useState } from "react";

// Copies a prompt for the Claude app that explains US-specific references in a case prompt.
// Only the prompt and the clarifying facts go in: never the answer key, so it can't spoil the case.
export function UsContextButton({ title, prompt, clarifying, industry }: { title: string; prompt: string; clarifying: string[]; industry: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  async function go() {
    const text = [
      "I'm an MBA student from India preparing for US consulting case interviews. Before I practice this case, explain the US-specific context a local candidate would take for granted.",
      `Case: ${title} (industry: ${industry})`,
      `Prompt:\n${prompt}`,
      clarifying.length ? `Background facts:\n${clarifying.map((c) => `- ${c}`).join("\n")}` : "",
      "Please cover, briefly:\n1. Any American companies, brands, places, institutions, programs or terms mentioned, and what each means.\n2. How this industry typically works in the US (who the customers are, how they buy, key players, seasonality) at a level useful for the case.\n3. Any US-specific factors I might miss (regulation, geography, labor costs, consumer habits).\n4. Comparisons to India where that helps.\nDo NOT solve the case, suggest a structure, or hint at the answer.",
    ].filter(Boolean).join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setMsg("✓ Copied. Paste it into the Claude app.");
    } catch {
      setMsg("Couldn't copy: your browser blocked the clipboard.");
    }
  }
  return (
    <span className="inline-flex flex-col">
      <button type="button" onClick={go} className="inline-flex min-h-10 items-center rounded-lg border border-line px-4 text-sm font-semibold">Explain the US context</button>
      {msg && <span role="status" className="mt-1 text-xs text-ink-2">{msg}</span>}
    </span>
  );
}
