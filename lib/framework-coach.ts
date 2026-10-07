import "server-only";
import { frameworksForText, type Framework, type FwNode } from "@/lib/frameworks";

// Builds the "framework coach" prompt: suggest a tailored structure for a case prompt and, if the
// candidate pasted their own, critique it. Grounded in the 2-3 closest canonical frameworks.

const outline = (n: FwNode, d = 0): string =>
  `${"  ".repeat(d)}- ${n.label}\n` + (n.children ?? []).map((c) => outline(c, d + 1)).join("");

function reference(f: Framework) {
  return [
    `### ${f.name}`,
    outline(f.tree).trimEnd(),
    `Use when: ${f.when_to_use.join("; ")}`,
    `Common mistakes: ${f.common_mistakes.join("; ")}`,
  ].join("\n");
}

export function coachPrompt(casePrompt: string, mine: string) {
  const refs = frameworksForText(`${casePrompt} ${mine}`, 3);
  const hasMine = mine.trim().length > 0;
  const system = [
    "You are an experienced MBB interviewer coaching an MBA candidate on case structuring.",
    "Principles: structures must be MECE, tailored to this client and question (no generic textbook labels), hypothesis-driven, 3-4 top-level branches with 2-3 specific sub-points each, and each branch should say what data would answer it.",
    refs.length
      ? "Canonical frameworks that are likely relevant (adapt, never recite):\n\n" + refs.map(reference).join("\n\n")
      : "No canonical framework matched closely: build one from first principles.",
    "Answer format (markdown, concise):",
    hasMine
      ? "1. **Score** the candidate's structure 1-5 on: MECE, tailoring, hypothesis, prioritisation. One line each.\n2. **What works** (max 3 bullets).\n3. **Fix these** (max 4 bullets, specific: name the branch).\n4. **Improved structure** as a nested bullet tree.\n5. **Opening line**: 2 sentences the candidate could say out loud."
      : "1. **Clarifying questions** worth asking (max 3).\n2. **Suggested structure** as a nested bullet tree, tailored to the case.\n3. **Why this structure** (2-3 bullets: what makes it fit this case).\n4. **Where I'd start** (the first branch to dig into, and the hypothesis).\n5. **Opening line**: 2 sentences the candidate could say out loud.",
  ].join("\n\n");
  const user = `Case prompt:\n${casePrompt.trim()}` + (hasMine ? `\n\nMy structure:\n${mine.trim()}` : "\n\nPlease suggest a structure.");
  return { system, user, references: refs.map((f) => ({ id: f.id, name: f.name })) };
}
