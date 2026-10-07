import { bad, requireApiUser } from "@/lib/api";
import { getCase } from "@/lib/cases";
import { getStore } from "@/lib/store";
import { FIRM_MODES, parseScorecard, type FirmMode } from "@/lib/scoring";

export async function GET() {
  const { deny } = await requireApiUser();
  if (deny) return deny;
  return Response.json(await getStore().listSessions());
}

// Body: { case_id, firm_mode, source, scorecard_text, transcript?, duration_min?, hints_used?, notes?, started_at? }
export async function POST(req: Request) {
  const { deny } = await requireApiUser();
  if (deny) return deny;
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return bad("Invalid JSON body");
  }
  const c = getCase(String(b.case_id ?? ""));
  if (!c) return bad("Unknown case");
  const firm = String(b.firm_mode ?? "") as FirmMode;
  if (!FIRM_MODES.some((f) => f.key === firm)) return bad("Unknown firm mode");
  const text = String(b.scorecard_text ?? "");
  if (text.length > 400_000) return bad("Scorecard text is too long");
  const parsed = parseScorecard(text, c.id);
  if (!parsed.ok) return bad(parsed.error, 422);
  const transcript = typeof b.transcript === "string" ? b.transcript.slice(0, 400_000) : null;
  const hints = Math.max(Number(b.hints_used) || 0, parsed.card.hints_used || 0);
  try {
    const rec = await getStore().saveSession({
      case_id: c.id,
      case_title: c.title,
      firm_mode: firm,
      source: b.source === "in-app" ? "in-app" : "claude-handoff",
      started_at: typeof b.started_at === "string" ? b.started_at : undefined,
      duration_min: Number(b.duration_min) || parsed.card.duration_minutes || null,
      hints_used: hints,
      scorecard: { ...parsed.card, hints_used: hints },
      transcript: transcript || (text.includes("END CASE") ? text : null),
      notes: typeof b.notes === "string" ? b.notes.slice(0, 5000) : null,
    });
    return Response.json({ id: rec.id });
  } catch (e) {
    return bad(`Couldn't save: ${(e as Error).message}`, 500);
  }
}
