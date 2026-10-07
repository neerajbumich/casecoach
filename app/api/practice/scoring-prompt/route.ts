import { bad, requireApiUser } from "@/lib/api";
import { getCase } from "@/lib/cases";
import { scoringPrompt } from "@/lib/interviewer";
import { FIRM_MODES, type FirmMode } from "@/lib/scoring";

// Builds a scoring prompt for a transcript that has no scorecard yet (e.g. a voice session in the Claude app).
export async function POST(req: Request) {
  const { deny } = await requireApiUser();
  if (deny) return deny;
  const b = await req.json().catch(() => ({}));
  const c = getCase(String(b.case_id ?? ""));
  if (!c) return bad("Unknown case");
  const firm = (FIRM_MODES.some((f) => f.key === b.firm_mode) ? b.firm_mode : "bain") as FirmMode;
  const transcript = String(b.transcript ?? "").slice(0, 300_000);
  if (transcript.length < 200) return bad("Paste the full transcript first");
  return Response.json({ prompt: scoringPrompt(c, transcript, firm) });
}
