"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { parseScorecard, type FirmMode } from "@/lib/scoring";

type Msg = { role: "user" | "assistant"; content: string };
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

// Browser speech (free): Web Speech API for listening, speechSynthesis for the interviewer's voice.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SR = any;
function getRecognizer(): SR | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const C = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!C) return null;
  const r = new C();
  r.lang = "en-US";
  r.interimResults = true;
  r.continuous = true;
  return r;
}

export function LiveInterview({ caseId, title, opts, exhibits }: { caseId: string; title: string; opts: Opts; exhibits: Ex[] }) {
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [spend, setSpend] = useState<{ spent: number; cap: number } | null>(null);
  const [hints, setHints] = useState(0);
  const [start] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [speak, setSpeak] = useState(opts.voice);
  const [listening, setListening] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [scorecardText, setScorecardText] = useState("");
  const rec = useRef<SR | null>(null);
  const silence = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  useEffect(() => setVoiceSupported(!!getRecognizer()), []);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [start]);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), [msgs, busy]);

  const say = useCallback(
    (text: string) => {
      if (!speak || typeof speechSynthesis === "undefined") return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/\|/g, ", ").replace(/[#*_`]/g, ""));
      u.rate = 1.05;
      speechSynthesis.speak(u);
    },
    [speak],
  );

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy) return;
      const next = [...msgs, { role: "user" as const, content }];
      setMsgs(next);
      setInput("");
      setBusy(true);
      setErr("");
      try {
        const r = await fetch("/api/interview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ case_id: caseId, opts, messages: next }) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        setMsgs([...next, { role: "assistant", content: j.reply }]);
        setSpend({ spent: j.spentUsd, cap: j.capUsd });
        if (/END CASE/i.test(content)) setScorecardText(j.reply);
        else say(j.reply);
      } catch (e) {
        setErr((e as Error).message);
        setMsgs(msgs);
        setInput(content);
      } finally {
        setBusy(false);
      }
    },
    [msgs, busy, caseId, opts, say],
  );

  // Kick off: the interviewer speaks first.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    send("(I'm ready. Please begin the interview.)");
  }, [send]);

  function startListening(auto: boolean) {
    const r = getRecognizer();
    if (!r) return setErr("Voice input isn't supported in this browser. Type instead, or use Safari/Chrome.");
    speechSynthesis?.cancel();
    let finalText = "";
    r.onresult = (e: SR) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      setInput((finalText + interim).trim());
      if (auto) {
        if (silence.current) clearTimeout(silence.current);
        silence.current = setTimeout(() => r.stop(), 1800); // hands-free: send after ~2s of silence
      }
    };
    r.onend = () => {
      setListening(false);
      if (auto && finalText.trim()) send(finalText);
    };
    r.onerror = () => setListening(false);
    rec.current = r;
    r.start();
    setListening(true);
  }
  function stopListening() {
    rec.current?.stop();
  }

  const parsed = scorecardText ? parseScorecard(scorecardText, caseId) : null;
  async function saveSession() {
    const transcript = msgs.map((m) => `${m.role === "user" ? "ME" : "INTERVIEWER"}: ${m.content}`).join("\n\n");
    const r = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ case_id: caseId, firm_mode: opts.firm, source: "in-app", scorecard_text: scorecardText, transcript, duration_min: Math.round(elapsed / 6) / 10, hints_used: hints }),
    });
    const j = await r.json();
    if (!r.ok) return setErr(j.error);
    router.push(`/sessions/${j.id}`);
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0"), ss = String(elapsed % 60).padStart(2, "0");
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href={`/practice/${caseId}`} className="text-sm text-muted hover:underline">← Back</Link>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        <div className="text-right text-sm">
          <span className={`text-2xl font-semibold tabular-nums ${elapsed > opts.minutes * 60 ? "text-warn" : ""}`}>{mm}:{ss}</span>
          {spend && <p className="text-xs text-muted">API spend this month ${spend.spent.toFixed(2)} / ${spend.cap}</p>}
        </div>
      </div>

      <div className="min-h-[40vh] space-y-3 rounded-xl border border-line bg-surface p-3" aria-live="polite">
        {msgs.filter((m, i) => !(i === 0 && m.content.startsWith("(I'm ready"))).map((m, i) => (
          <div key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[15px] ${m.role === "user" ? "ml-auto bg-accent text-accent-ink" : "bg-surface-2"}`}>{m.content}</div>
        ))}
        {busy && <div className="w-24 rounded-2xl bg-surface-2 px-3 py-2 text-sm text-muted">Thinking…</div>}
        <div ref={endRef} />
      </div>

      {err && <p role="alert" className="text-sm text-warn">{err}</p>}

      {parsed?.ok ? (
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="font-semibold">Scorecard ready: overall {parsed.card.overall}/5</p>
          <button onClick={saveSession} className="mt-2 min-h-11 w-full rounded-lg bg-accent font-semibold text-accent-ink">Save session</button>
        </div>
      ) : (
        <>
          <div className="flex items-end gap-2">
            <label htmlFor="say" className="sr-only">Your answer</label>
            <textarea
              id="say"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={2}
              placeholder={listening ? "Listening…" : "Type or hold the mic…"}
              className="flex-1 rounded-xl border border-line bg-surface p-3 text-base"
            />
            <button onClick={() => send(input)} disabled={busy || !input.trim()} className="min-h-12 rounded-xl bg-accent px-4 font-semibold text-accent-ink disabled:opacity-50">Send</button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {voiceSupported && !handsFree && (
              <button
                onPointerDown={() => startListening(false)}
                onPointerUp={stopListening}
                onPointerLeave={() => listening && stopListening()}
                className={`min-h-11 select-none rounded-lg px-4 ${listening ? "bg-warn text-white" : "border border-line"}`}
                aria-pressed={listening}
              >
                {listening ? "Listening… release to stop" : "Hold to talk"}
              </button>
            )}
            {voiceSupported && (
              <button
                onClick={() => {
                  const on = !handsFree;
                  setHandsFree(on);
                  if (on) startListening(true);
                  else stopListening();
                }}
                aria-pressed={handsFree}
                className={`min-h-11 rounded-lg px-4 ${handsFree ? "bg-accent text-accent-ink" : "border border-line"}`}
              >
                Hands-free {handsFree ? "on" : "off"}
              </button>
            )}
            {handsFree && !listening && !busy && <button onClick={() => startListening(true)} className="min-h-11 rounded-lg border border-line px-3">Listen again</button>}
            <label className="flex min-h-11 items-center gap-2 px-1">
              <input type="checkbox" checked={speak} onChange={(e) => { setSpeak(e.target.checked); if (!e.target.checked) speechSynthesis?.cancel(); }} className="h-4 w-4" /> Speak replies
            </label>
            <button onClick={() => { setHints((h) => h + 1); send("HINT"); }} disabled={busy} className="min-h-11 rounded-lg border border-line px-3">Pause for a hint ({hints})</button>
            <button onClick={() => send("END CASE")} disabled={busy || msgs.length < 4} className="ml-auto min-h-11 rounded-lg border border-line px-3">End case &amp; score</button>
          </div>
        </>
      )}

      {exhibits.length > 0 && (
        <details className="rounded-xl border border-line bg-surface">
          <summary className="flex min-h-11 items-center px-4 text-sm font-semibold">Exhibits (reveal when handed over)</summary>
          <div className="space-y-2 px-4 pb-4">
            {exhibits.map((e, i) =>
              shown[e.id] ? (
                <figure key={e.id}>
                  <figcaption className="text-sm font-medium">{e.title}</figcaption>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {e.image ? <img src={e.image} alt={e.title} className="mt-1 h-auto w-full rounded border border-line bg-white" /> : e.data ? <ExTable d={e.data} /> : <p className="text-sm text-muted">The interviewer will read out this exhibit.</p>}
                </figure>
              ) : (
                <button key={e.id} onClick={() => setShown((s) => ({ ...s, [e.id]: true }))} className="min-h-10 w-full rounded-lg border border-dashed border-line text-sm">Reveal exhibit {i + 1}</button>
              ),
            )}
          </div>
        </details>
      )}
    </div>
  );
}
