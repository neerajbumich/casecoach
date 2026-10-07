import { bad, requireApiUser } from "@/lib/api";
import { allowedEmails } from "@/lib/auth-config";
import { getCase } from "@/lib/cases";
import { getStore } from "@/lib/store";
import { DIMENSIONS, FIRM_MODES, MISTAKE_CATEGORIES, type FirmMode, type Scorecard } from "@/lib/scoring";

export async function GET() {
  const { user, deny } = await requireApiUser();
  if (deny) return deny;
  return Response.json(await getStore().listFeedback(user.email));
}

// A casing partner (or the owner, interviewing a partner) submits a scorecard for a candidate.
// Body: { candidate_email, case_id, firm_mode, duration_min, scores: {dim: 1-5}, comments: {dim: text},
//         mistakes: [{category, description}], went_well: string, work_on: string }
export async function POST(req: Request) {
  const { user, deny } = await requireApiUser();
  if (deny) return deny;
  const b = await req.json().catch(() => null);
  if (!b) return bad("Invalid JSON");
  const candidate = String(b.candidate_email ?? "").trim().toLowerCase();
  if (!allowedEmails().includes(candidate)) return bad("The candidate must be someone invited to this app.");
  if (candidate === user.email) return bad("You can't score yourself here: use Practice for self-scored sessions.");
  const c = getCase(String(b.case_id ?? ""));
  if (!c) return bad("Unknown case");
  const firm = (FIRM_MODES.some((f) => f.key === b.firm_mode) ? b.firm_mode : "bain") as FirmMode;
  const clamp = (v: unknown) => Math.min(5, Math.max(1, Math.round(Number(v) * 2) / 2 || 3));
  const txt = (v: unknown, n = 1500) => (typeof v === "string" ? v.slice(0, n) : "");
  const scores = Object.fromEntries(
    DIMENSIONS.map((d) => [d.key, { score: clamp(b.scores?.[d.key]), evidence: [], comment: txt(b.comments?.[d.key], 600) }]),
  ) as unknown as Scorecard["scores"];
  const vals = DIMENSIONS.map((d) => scores[d.key].score);
  const overall = Math.round((vals.reduce((a, v) => a + v, 0) / vals.length) * 2) / 2;
  const mistakes = (Array.isArray(b.mistakes) ? b.mistakes : [])
    .filter((m: { category?: string }) => MISTAKE_CATEGORIES.some((k) => k.key === m.category))
    .slice(0, 20)
    .map((m: { category: string; description?: string }) => ({ category: m.category, description: txt(m.description, 400) || MISTAKE_CATEGORIES.find((k) => k.key === m.category)!.label }));
  const wentWell = txt(b.went_well);
  const workOn = txt(b.work_on);
  const card: Scorecard = {
    version: 1,
    case_id: c.id,
    overall,
    scores,
    where_i_went_wrong: workOn ? [{ moment: "Partner feedback", what_happened: workOn, better: "" }] : [],
    mistakes,
    framework_comparison: { mine: "", ideal: c.suggested_framework?.summary ?? "", gap: "" },
    alternative_frameworks: [],
    drills: wentWell ? [{ title: "What went well (keep doing)", how: wentWell }] : [],
    hints_used: Math.max(0, Number(b.hints_used) || 0),
    duration_minutes: Number(b.duration_min) || undefined,
  };
  const row = await getStore().giveFeedback({
    author_email: user.email,
    candidate_email: candidate,
    case_id: c.id,
    case_title: c.title,
    firm_mode: firm,
    duration_min: Number(b.duration_min) || null,
    scorecard: card,
  });
  return Response.json(row, { status: 201 });
}
