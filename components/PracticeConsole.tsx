"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FIRM_MODES, parseScorecard, type FirmMode } from "@/lib/scoring";

type Ex = { id: string; title: string; image: string | null; data: { columns: string[]; rows: (string | number | null)[][] } | null };

function ExTable({ d }: { d: NonNullable<Ex["data"]> }) {
  return (
    <div className="mt-1 overflow-x-auto">
      <table className="min-w-full border-collapse text-xs">
        <thead><tr>{d.columns.map((c, i) => <th key={i} className="border-b border-line px-2 py-1 text-left">{c}</th>)}</tr></thead>
        <tbody>{d.rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j} className="px-2 py-1">{v ?? ""}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
type Opts = { firm: FirmMode; fit: boolean; minutes: number; voice: boolean };

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
const btn = "min-h-11 rounded-lg px-4 text-sm font-semibold";

function Timer({ minutes, onMinutes }: { minutes: number; onMinutes: (m: number) => void }) {
  const [sec, setSec] = useState(0);
  const [running, setRunning] = useState(false);
  const t = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (running) t.current = setInterval(() => setSec((s) => s + 1), 1000);
    return () => {
      if (t.current) clearInterval(t.current);
    };
  }, [running]);
  useEffect(() => onMinutes(Math.round((sec / 60) * 10) / 10), [sec, onMinutes]);
  const over = sec > minutes * 60;
  const mm = String(Math.floor(sec / 60)).padStart(2, "0"), ss = String(sec % 60).padStart(2, "0");
  return (
    <div className="flex items-center gap-3">
      <span className={`text-3xl font-semibold tabular-nums ${over ? "text-warn" : ""}`} aria-live="off">{mm}:{ss}</span>
      <span className="text-xs text-muted">/ {minutes}:00</span>
      <button onClick={() => setRunning((r) => !r)} className={`${btn} ml-auto bg-accent text-accent-ink`}>{running ? "Pause" : sec ? "Resume" : "Start timer"}</button>
      <button onClick={() => { setRunning(false); setSec(0); }} className={`${btn} border border-line font-normal`} aria-label="Reset timer">Reset</button>
    </div>
  );
}

export function PracticeConsole({ caseId, title, meta, opts, prompt, exhibits, llmEnabled }: { caseId: string; title: string; meta: string; opts: Opts; prompt: string; exhibits: Ex[]; llmEnabled: boolean }) {
  const router = useRouter();
  const [copied, setCopied] = useState<"" | "prompt" | "scoring">("");
  const [hints, setHints] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [scratch, setScratch] = useState("");
  const [scoreText, setScoreText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const skey = `cc-scratch-${caseId}`;

  useEffect(() => {
    try {
      setScratch(localStorage.getItem(skey) ?? "");
    } catch {}
  }, [skey]);
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(skey, scratch);
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [scratch, skey]);

  const preview = scoreText.trim() ? parseScorecard(scoreText, caseId) : null;
  const firmLabel = FIRM_MODES.find((f) => f.key === opts.firm)?.label;
  const liveUrl = `/practice/${caseId}/live?firm=${opts.firm}&fit=${opts.fit ? 1 : 0}&min=${opts.minutes}&voice=${opts.voice ? 1 : 0}`;

  async function getScoringPrompt() {
    setMsg(null);
    const r = await fetch("/api/practice/scoring-prompt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ case_id: caseId, firm_mode: opts.firm, transcript }) });
    const j = await r.json();
    if (!r.ok) return setMsg({ kind: "err", text: j.error });
    if (await copy(j.prompt)) {
      setCopied("scoring");
      setMsg({ kind: "ok", text: "Scoring prompt copied. Paste it into a NEW Claude chat, then paste Claude's JSON reply in the scorecard box." });
    }
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const r = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ case_id: caseId, firm_mode: opts.firm, source: "claude-handoff", scorecard_text: scoreText, transcript: transcript || null, duration_min: elapsed || null, hints_used: hints }),
    });
    const j = await r.json().catch(() => ({}));
    setSaving(false);
    if (!r.ok) return setMsg({ kind: "err", text: j.error ?? "Couldn't save" });
    try {
      localStorage.removeItem(skey);
    } catch {}
    router.push(`/sessions/${j.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/practice" className="hover:underline">Practice</Link> / {title}
      </nav>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted">{meta} · {firmLabel}{opts.fit ? " · with fit question" : ""} · {opts.minutes} min</p>
      </header>

      <section className={card} aria-labelledby="h-1">
        <h2 id="h-1" className="font-semibold">1 · Start the interview in Claude</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink-2">
          <li>Tap <b>Copy interviewer prompt</b>. Don&apos;t read it: it contains the answer key.</li>
          <li>Open a <b>new chat</b> in the Claude app and paste the prompt.{opts.voice ? " On iPhone, send it, then tap the voice button and talk." : ""}</li>
          <li>Say or type <b>hint</b> if you&apos;re stuck. When you&apos;re done, say or type <b>END CASE</b> to get your scorecard.</li>
        </ol>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={async () => {
              if (await copy(prompt)) setCopied("prompt");
            }}
            className={`${btn} bg-accent text-accent-ink`}
          >
            {copied === "prompt" ? "✓ Copied" : "Copy interviewer prompt"}
          </button>
          <a href="https://claude.ai/new" target="_blank" rel="noreferrer" className={`${btn} inline-flex items-center border border-line font-normal`}>Open Claude ↗</a>
          {llmEnabled && <Link href={liveUrl} className={`${btn} inline-flex items-center border border-line font-normal`}>Use in-app interviewer</Link>}
        </div>
      </section>

      <section className={`${card} space-y-4`} aria-labelledby="h-2">
        <h2 id="h-2" className="font-semibold">2 · Your tools during the case</h2>
        <Timer minutes={opts.minutes} onMinutes={setElapsed} />
        <div className="flex items-center gap-3 text-sm">
          <span>Hints used: <b className="tabular-nums">{hints}</b></span>
          <button onClick={() => setHints((h) => h + 1)} className="min-h-9 rounded-lg border border-line px-3">+1 hint</button>
          <span className="text-xs text-muted">(also say &quot;hint&quot; to Claude)</span>
        </div>
        <div>
          <label htmlFor="scratch" className="text-sm font-medium">Scratchpad</label>
          <textarea id="scratch" value={scratch} onChange={(e) => setScratch(e.target.value)} rows={6} placeholder="Structure, math, notes… (saved on this device)" className="mt-1 w-full rounded-lg border border-line bg-bg p-3 font-mono text-sm" />
        </div>
        {exhibits.length > 0 && (
          <div>
            <p className="text-sm font-medium">Exhibits: reveal each one only when the interviewer hands it over</p>
            <div className="mt-2 space-y-2">
              {exhibits.map((e, i) =>
                shown[e.id] ? (
                  <figure key={e.id} className="rounded-lg border border-line p-2">
                    <figcaption className="text-sm font-semibold">{e.title}</figcaption>
                    {e.image ? (
                      <a href={e.image} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={e.image} alt={e.title} className="mt-1 h-auto w-full rounded border border-line bg-white" />
                      </a>
                    ) : e.data ? (
                      <ExTable d={e.data} />
                    ) : (
                      <p className="text-sm text-muted">No image; the interviewer will read out the data.</p>
                    )}
                  </figure>
                ) : (
                  <button key={e.id} onClick={() => setShown((s) => ({ ...s, [e.id]: true }))} className="min-h-10 w-full rounded-lg border border-dashed border-line text-sm">
                    Reveal exhibit {i + 1}
                  </button>
                ),
              )}
            </div>
          </div>
        )}
      </section>

      <section className={`${card} space-y-3`} aria-labelledby="h-3">
        <h2 id="h-3" className="font-semibold">3 · Save your scorecard</h2>
        <p className="text-sm text-ink-2">After <b>END CASE</b>, copy Claude&apos;s last reply (the one with the <code>json</code> block) and paste it here.</p>
        <label htmlFor="score" className="sr-only">Scorecard</label>
        <textarea id="score" value={scoreText} onChange={(e) => setScoreText(e.target.value)} rows={6} placeholder="Paste Claude's scorecard reply here" className="w-full rounded-lg border border-line bg-bg p-3 font-mono text-xs" />
        {preview && (
          <p role="status" className={`text-sm ${preview.ok ? "text-ok" : "text-warn"}`}>
            {preview.ok ? `✓ Scorecard found: overall ${preview.card.overall}/5, ${preview.card.mistakes.length} mistakes logged, ${preview.card.drills.length} drills.` : preview.error}
          </p>
        )}
        <details className="rounded-lg bg-surface-2">
          <summary className="flex min-h-10 items-center px-3 text-sm font-medium">Add the full transcript (optional) · or get a scorecard for a chat without one</summary>
          <div className="space-y-2 px-3 pb-3">
            <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={6} placeholder="Paste the whole conversation" className="w-full rounded-lg border border-line bg-bg p-3 font-mono text-xs" />
            <button onClick={getScoringPrompt} disabled={transcript.length < 200} className="min-h-10 rounded-lg border border-line px-3 text-sm disabled:opacity-50">
              {copied === "scoring" ? "✓ Scoring prompt copied" : "No scorecard? Copy a scoring prompt"}
            </button>
          </div>
        </details>
        {msg && <p role="alert" className={`text-sm ${msg.kind === "ok" ? "text-ok" : "text-warn"}`}>{msg.text}</p>}
        <button onClick={save} disabled={!preview?.ok || saving} className={`${btn} w-full bg-accent text-accent-ink disabled:opacity-50`}>{saving ? "Saving…" : "Save session"}</button>
      </section>
    </div>
  );
}
