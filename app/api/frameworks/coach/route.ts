import { bad, requireApiUser } from "@/lib/api";
import { coachPrompt } from "@/lib/framework-coach";
import { chat, LlmError } from "@/lib/llm";
import { llmEnabled } from "@/lib/llm-config";

// Body: { case_prompt, mine?, run?: boolean }
// run=false (default): returns the handoff prompt for the Claude app (free) and the matched frameworks.
// run=true: calls the API when the in-app AI is enabled (key + monthly cap).
export async function POST(req: Request) {
  const { user, deny } = await requireApiUser();
  if (deny) return deny;
  const b = await req.json().catch(() => ({}));
  const casePrompt = String(b.case_prompt ?? "").slice(0, 4000);
  const mine = String(b.mine ?? "").slice(0, 4000);
  if (casePrompt.trim().length < 15) return bad("Paste the case prompt first.");
  const p = coachPrompt(casePrompt, mine);
  if (!b.run) {
    return Response.json({ handoff: `${p.system}\n\n---\n\n${p.user}`, references: p.references, ai: llmEnabled() });
  }
  try {
    const r = await chat({ userKey: user.email, system: p.system, messages: [{ role: "user", content: p.user }], maxTokens: 1500 });
    return Response.json({ reply: r.text, references: p.references, costUsd: r.costUsd, spentUsd: r.spentUsd, capUsd: r.capUsd });
  } catch (e) {
    const err = e as LlmError;
    return bad(err.message, err.status ?? 500);
  }
}
