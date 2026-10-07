"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { parseAnswer, fmt } from "@/lib/mental-math";
import type { DrillResult, MarketSizing } from "@/lib/training-types";
import { newKey, useItems } from "@/components/useItems";

const card = "rounded-xl border border-line bg-surface p-4";
const btn = "min-h-11 rounded-lg px-4 text-sm font-semibold";
const LIMIT = 300;

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function verdict(v: number, p: MarketSizing) {
  const ratio = v / p.estimate_value;
  if (v >= p.range[0] && v <= p.range[1]) return { ok: true, text: ratio > 0.8 && ratio < 1.25 ? "Spot on: within 25% of the model answer." : "In the acceptable range." };
  return { ok: false, text: ratio > 1 ? `About ${ratio.toFixed(1)}× too high. Check which assumption is inflated.` : `About ${(1 / ratio).toFixed(1)}× too low. Check which driver you left out or under-sized.` };
}

export function SizingDrill({ p, nextHref }: { p: MarketSizing; nextHref: string }) {
  const { put } = useItems<DrillResult>("drill");
  const [phase, setPhase] = useState<"work" | "review">("work");
  const [structure, setStructure] = useState("");
  const [answer, setAnswer] = useState("");
  const [left, setLeft] = useState(LIMIT);
  const [status, setStatus] = useState<string | null>(null);
  const startedAt = useRef(Date.now());
  const [used, setUsed] = useState(0);

  useEffect(() => {
    if (phase !== "work") return;
    const t = setInterval(() => setLeft(LIMIT - Math.round((Date.now() - startedAt.current) / 1000)), 500);
    return () => clearInterval(t);
  }, [phase]);

  const v = parseAnswer(answer);
  const scale = p.unit === "$" ? "$" : "";
  const res = v ? verdict(v, p) : null;

  function reveal() {
    const sec = Math.round((Date.now() - startedAt.current) / 1000);
    setUsed(sec);
    setPhase("review");
    if (v) put(newKey(), { drill: "sizing", at: new Date().toISOString(), score: verdict(v, p).ok ? 1 : 0, avg_sec: sec, ref: p.id, label: p.question });
  }

  const prompt = [
    "You are an MBB interviewer. Grade my market sizing briefly: structure (MECE? right drivers?), assumptions (reasonable? any stated without logic?), math, sanity check, and communication. Then give the 2 biggest fixes.",
    `Question: ${p.question}`,
    `My structure and assumptions:\n${structure.trim() || "(not typed)"}`,
    `My answer: ${answer || "(none)"}`,
    `Reference approach (one of several valid ones): ${p.approach.join(" | ")} → ${p.estimate}`,
  ].join("\n\n");

  const mm = Math.floor(Math.abs(left) / 60);
  const ss = String(Math.abs(left) % 60).padStart(2, "0");
  return (
    <div className="space-y-4">
      <section className={card}>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{["", "Easy", "Medium", "Hard"][p.difficulty]} · {p.tags.join(" · ")}</p>
        <p className="mt-1 text-lg font-semibold leading-snug">{p.question}</p>
        {phase === "work" && (
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer text-ink-2">Clarifying answers (ask first, then peek)</summary>
            <ul className="mt-1 list-disc pl-5">{p.clarify.map((c) => <li key={c}>{c}</li>)}</ul>
          </details>
        )}
      </section>

      {phase === "work" ? (
        <section className={`${card} space-y-3`}>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Target: 5 minutes</span>
            <span role="timer" className={`text-2xl font-semibold tabular-nums ${left < 0 ? "text-warn" : ""}`}>{left < 0 ? "+" : ""}{mm}:{ss}</span>
          </div>
          <label htmlFor="st" className="block text-sm text-ink-2">Talk it through out loud. Optionally jot your driver tree and assumptions:</label>
          <textarea id="st" rows={5} value={structure} onChange={(e) => setStructure(e.target.value)} className="w-full rounded-lg border border-line bg-bg p-3 font-mono text-sm"
            placeholder={"US households 130M\n× share with a dog 40%\n× …"} />
          <label htmlFor="est" className="block text-sm font-medium">Your estimate</label>
          <input id="est" value={answer} onChange={(e) => setAnswer(e.target.value)} inputMode="decimal" placeholder={p.unit === "$" ? "e.g. $9B" : "e.g. 750M"}
            className="min-h-11 w-full rounded-lg border border-line bg-bg px-3 text-lg tabular-nums" />
          {answer && v === null && <p className="text-xs text-warn">Couldn&apos;t read that number. Try 9B, 750M or 1,200.</p>}
          <button type="button" onClick={reveal} className={`${btn} bg-accent text-accent-ink`}>{v ? "Check my answer" : "Show the approach"}</button>
        </section>
      ) : (
        <>
          {v !== null && res && (
            <section className={`${card} border-l-4 ${res.ok ? "border-l-ok" : "border-l-warn"}`} aria-live="polite">
              <p className="font-semibold">You: {fmt(v, scale as "" | "$")} · Model: {p.estimate} · {Math.floor(used / 60)}m {used % 60}s</p>
              <p className="text-sm text-ink-2">{res.text} Accepted range: {fmt(p.range[0], scale as "" | "$")}–{fmt(p.range[1], scale as "" | "$")}.</p>
            </section>
          )}
          <section className={`${card} space-y-3`}>
            <h2 className="font-semibold">A model approach</h2>
            <ol className="list-decimal space-y-1 pl-5 font-mono text-[13px]">{p.approach.map((a) => <li key={a}>{a}</li>)}</ol>
            <div>
              <h3 className="text-sm font-semibold">Assumptions</h3>
              <ul className="mt-1 space-y-1 text-sm">
                {p.assumptions.map((a) => <li key={a.label}><b>{a.label}:</b> {a.value}{a.why && <span className="text-ink-2"> ({a.why})</span>}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Math</h3>
              <ul className="mt-1 space-y-0.5 font-mono text-[13px] tabular-nums">{p.calc.map((c) => <li key={c}>{c}</li>)}</ul>
            </div>
            <p className="text-sm"><b>Sanity check:</b> {p.sanity_check}</p>
            <p className="text-sm"><b>So what:</b> {p.so_what}</p>
          </section>
          <div className="flex flex-wrap gap-2">
            <Link href={nextHref} className={`${btn} inline-flex items-center bg-accent text-accent-ink`}>Next problem</Link>
            <button type="button" className={`${btn} border border-line`} onClick={async () => setStatus((await copy(prompt)) ? "✓ Copied. Paste into the Claude app for feedback." : "Couldn't copy.")}>
              Copy feedback prompt
            </button>
          </div>
          <p role="status" className="min-h-5 text-sm text-ink-2">{status}</p>
        </>
      )}
    </div>
  );
}
