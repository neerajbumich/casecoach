"use client";
import Link from "next/link";
import { useState } from "react";

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

const card = "rounded-xl border border-line bg-surface p-4";
const input = "w-full rounded-lg border border-line bg-bg p-3 text-base";
const btn = "min-h-11 rounded-lg px-4 text-sm font-semibold disabled:opacity-50";

type Ref = { id: string; name: string };

export function FrameworkCoach({ ai }: { ai: boolean }) {
  const [prompt, setPrompt] = useState("");
  const [mine, setMine] = useState("");
  const [refs, setRefs] = useState<Ref[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [reply, setReply] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function call(run: boolean) {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/frameworks/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ case_prompt: prompt, mine, run }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Something went wrong");
      setRefs(j.references);
      if (run) {
        setReply(j.reply);
        setStatus(`Cost $${j.costUsd.toFixed(3)} · $${j.spentUsd.toFixed(2)} of $${j.capUsd} this month`);
      } else {
        const ok = await copy(j.handoff);
        setStatus(ok ? "✓ Copied. Paste it into a new chat in the Claude app." : "Couldn't copy: your browser blocked the clipboard.");
      }
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const ready = prompt.trim().length >= 15;
  return (
    <div className="space-y-4">
      <div className={card}>
        <label htmlFor="cp" className="font-semibold">1. Case prompt</label>
        <p className="mb-2 text-xs text-muted">Paste or type the prompt, e.g. from a casing partner or a firm&apos;s website.</p>
        <textarea id="cp" rows={5} value={prompt} onChange={(e) => setPrompt(e.target.value)} className={input}
          placeholder="Our client is a regional grocery chain whose profits fell 20% last year…" />
      </div>
      <div className={card}>
        <label htmlFor="mine" className="font-semibold">2. Your structure <span className="font-normal text-muted">(optional)</span></label>
        <p className="mb-2 text-xs text-muted">Write your framework first, then get it critiqued. Leave empty to get a suggested structure.</p>
        <textarea id="mine" rows={7} value={mine} onChange={(e) => setMine(e.target.value)} className={`${input} font-mono text-sm`}
          placeholder={"1. Revenue\n   - price, volume by store format\n2. Costs\n   - …"} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!ready || busy} onClick={() => call(false)} className={`${btn} bg-accent text-accent-ink`}>
          {mine.trim() ? "Copy critique prompt for Claude app" : "Copy structure prompt for Claude app"}
        </button>
        {ai && (
          <button type="button" disabled={!ready || busy} onClick={() => call(true)} className={`${btn} border border-line bg-surface`}>
            {busy ? "Thinking…" : mine.trim() ? "Critique in app" : "Suggest in app"}
          </button>
        )}
      </div>
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-ink-2">{status}</p>
      {refs && refs.length > 0 && (
        <div className="text-sm">
          <span className="text-muted">Closest canonical frameworks: </span>
          {refs.map((r, i) => (
            <span key={r.id}>
              {i > 0 && ", "}
              <Link href={`/frameworks/${r.id}`} className="underline">{r.name}</Link>
            </span>
          ))}
        </div>
      )}
      {reply && <div className={`${card} whitespace-pre-wrap text-sm leading-relaxed`}>{reply}</div>}
      {!ai && (
        <p className="text-xs text-muted">The in-app coach is off (no API key or spend cap), so the free Claude-app handoff is used. See Settings → AI.</p>
      )}
    </div>
  );
}
