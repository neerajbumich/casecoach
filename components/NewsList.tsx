"use client";
import Link from "next/link";
import { useState } from "react";
import type { Ranked } from "@/lib/news-rank";

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

function ago(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function povPrompt(n: Ranked) {
  return [
    "I'm an MBA student recruiting for consulting (MBB) and tech. Help me turn this headline into interview material.",
    `Headline (${n.source}, ${new Date(n.published).toDateString()}): ${n.title}`,
    n.summary ? `Summary: ${n.summary}` : "",
    "Give me: (1) a 30-second point of view I could say out loud, (2) the business logic or economics behind it, (3) how it could show up as a case question and the structure I'd use, (4) one smart question to ask a consultant or tech interviewer about it. Be concise; flag anything you're unsure about since this may be after your knowledge cutoff.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function NewsList({ items, compact = false }: { items: Ranked[]; compact?: boolean }) {
  const [copied, setCopied] = useState<string | null>(null);
  if (!items.length) return <p className="text-sm text-muted">No matching stories in the last two weeks.</p>;
  return (
    <ul className="divide-y divide-line">
      {items.map((n) => (
        <li key={n.id} className="py-3 first:pt-0 last:pb-0">
          <a href={n.link} target="_blank" rel="noopener noreferrer" className="group block">
            <span className="block font-medium leading-snug group-hover:underline">{n.title}</span>
          </a>
          <span className="mt-0.5 block text-xs text-muted" suppressHydrationWarning>
            {n.source}
            {n.source === "WSJ" && ` ${n.section}`} · {ago(n.published)}
          </span>
          {!compact && n.summary && <p className="mt-1 line-clamp-2 text-sm text-ink-2">{n.summary}</p>}
          {n.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {n.tags.map((t) => (
                <span key={t} className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium">{t}</span>
              ))}
            </div>
          )}
          {!compact && n.why && (
            <p className="mt-1.5 text-sm">
              <span className="text-ink-2">{n.why.text}</span>
              {n.why.framework && (
                <>
                  {" "}
                  <Link href={`/frameworks/${n.why.framework}`} className="underline">Framework →</Link>
                </>
              )}
            </p>
          )}
          {!compact && (
            <button
              type="button"
              onClick={async () => setCopied((await copy(povPrompt(n))) ? n.id : null)}
              className="mt-1.5 min-h-9 text-sm font-medium text-ink-2 underline"
            >
              {copied === n.id ? "✓ Copied: paste into the Claude app" : "Prep a point of view (copy prompt)"}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
