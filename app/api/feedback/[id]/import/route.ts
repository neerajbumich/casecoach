import { bad, requireApiUser } from "@/lib/api";
import { getStore } from "@/lib/store";

// The candidate adds a partner's scorecard to their own session log and mistake journal.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, deny } = await requireApiUser();
  if (deny) return deny;
  const { id } = await params;
  const store = getStore();
  const fb = await store.markFeedbackImported(id, user.email);
  if (!fb) return bad("Not found or already added", 404);
  const rec = await store.saveSession({
    case_id: fb.case_id,
    case_title: fb.case_title,
    firm_mode: fb.firm_mode,
    source: "partner",
    started_at: fb.created_at,
    duration_min: fb.duration_min,
    hints_used: fb.scorecard.hints_used ?? 0,
    scorecard: fb.scorecard,
    notes: `Scored by casing partner ${fb.author_email}`,
  });
  return Response.json({ session_id: rec.id });
}
