import { bad, requireApiUser } from "@/lib/api";
import { getCase } from "@/lib/cases";
import { interviewerPrompt } from "@/lib/interviewer";
import { chat, LlmError, type Msg } from "@/lib/llm";
import { FIRM_MODES, type FirmMode } from "@/lib/scoring";

// One interviewer turn. Body: { case_id, opts: {firm, fit, minutes, voice}, messages: [{role, content}] }
export async function POST(req: Request) {
  const { user, deny } = await requireApiUser();
  if (deny) return deny;
  const b = await req.json().catch(() => ({}));
  const c = getCase(String(b.case_id ?? ""));
  if (!c) return bad("Unknown case");
  const o = b.opts ?? {};
  const firm = (FIRM_MODES.some((f) => f.key === o.firm) ? o.firm : "bain") as FirmMode;
  const opts = { firm, fit: !!o.fit, minutes: Math.min(60, Math.max(10, Number(o.minutes) || 30)), voice: !!o.voice };
  const messages: Msg[] = (Array.isArray(b.messages) ? b.messages : [])
    .filter((m: Msg) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-80)
    .map((m: Msg) => ({ role: m.role, content: m.content.slice(0, 8000) }));
  // The API needs the first message to be from the user.
  if (!messages.length || messages[0].role !== "user") messages.unshift({ role: "user", content: "(I'm ready. Please begin the interview.)" });
  const ending = /END CASE/i.test(messages[messages.length - 1]?.content ?? "");
  try {
    const r = await chat({ userKey: user.email, system: interviewerPrompt(c, opts), messages, maxTokens: ending ? 4000 : 600 });
    return Response.json({ reply: r.text, costUsd: r.costUsd, spentUsd: r.spentUsd, capUsd: r.capUsd });
  } catch (e) {
    const err = e as LlmError;
    return bad(err.message, err.status ?? 500);
  }
}
