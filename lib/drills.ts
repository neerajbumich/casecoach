import "server-only";
import { getCase, getIndex } from "@/lib/cases";
import { frameworksForText } from "@/lib/frameworks";
import type { CaseRecord, FrameworkNode } from "@/lib/schema/case";
import type { DrillKind } from "@/lib/communication";

// Builds one drill item from a real library case. Everything returned here is shown to the
// signed-in user only (pages call requireUser via the (app) layout).

export type StructureItem = {
  kind: "structure";
  caseId: string;
  title: string;
  prompt: string;
  clarifying: { q: string; a: string }[];
  model: { summary: string; tree: FrameworkNode };
  frameworks: { id: string; name: string }[];
};
export type ExhibitItem = {
  kind: "exhibit";
  caseId: string;
  title: string;
  question: string;
  exhibit: { title: string; image?: string; table?: { columns: string[]; rows: (string | number)[][] } };
  insight: string;
};
export type SynthesisItem = {
  kind: "synthesis";
  caseId: string;
  title: string;
  prompt: string;
  findings: string[];
  model: string;
};
export type DrillItem = StructureItem | ExhibitItem | SynthesisItem;

const pick = <T,>(xs: T[]): T | undefined => xs[Math.floor(Math.random() * xs.length)];
const clean = (s: string) => s.replace(/\s+/g, " ").trim();
/** Shortens to whole sentences (never mid-sentence), up to roughly `max` characters. */
function sentences(s: string, max = 420) {
  const parts = clean(s).match(/[^.!?]+[.!?]+(\s|$)/g) ?? [clean(s)];
  let out = "";
  for (const p of parts) {
    if (out && (out + p).length > max) break;
    out += p;
  }
  return out.trim() || clean(s);
}

function exhibitOk(e: CaseRecord["exhibits"][number]) {
  const image = e.image_path && !e.image_has_answers;
  const table = e.data && e.data.rows.length > 0;
  return (image || table) && e.key_insight && e.key_insight.length > 20;
}

function eligible(kind: DrillKind, c: CaseRecord): boolean {
  if (kind === "structure") return c.prompt.length > 60 && !!c.suggested_framework?.tree?.children?.length;
  if (kind === "exhibit") return (c.exhibits ?? []).some(exhibitOk);
  return (c.synthesis ?? "").length > 80 && ((c.math ?? []).length > 0 || (c.exhibits ?? []).length > 0);
}

export function drillItem(kind: DrillKind, caseId?: string): DrillItem | null {
  let c = caseId ? getCase(caseId) : undefined;
  if (!c || !eligible(kind, c)) {
    const ids = getIndex().map((x) => x.id);
    const pool = ids.map((id) => getCase(id)!).filter((x) => x && eligible(kind, x));
    c = pick(pool);
  }
  if (!c) return null;

  if (kind === "structure") {
    return {
      kind,
      caseId: c.id,
      title: c.title,
      prompt: c.prompt,
      clarifying: (c.clarifying_info ?? []).slice(0, 6).map((x) => ({ q: x.question_topic, a: x.answer })),
      model: { summary: c.suggested_framework.summary, tree: c.suggested_framework.tree },
      frameworks: frameworksForText(c.prompt, 2).map((f) => ({ id: f.id, name: f.name })),
    };
  }
  if (kind === "exhibit") {
    const e = pick(c.exhibits.filter(exhibitOk))!;
    const image = e.image_path && !e.image_has_answers ? `/api/${e.image_path}` : undefined;
    return {
      kind,
      caseId: c.id,
      title: c.title,
      question: sentences(c.prompt),
      exhibit: { title: e.title, image, table: image ? undefined : e.data },
      insight: e.key_insight,
    };
  }
  const findings = [
    ...(c.math ?? []).map((m) => `${clean(m.question)} → ${clean(m.answer)}`),
    ...(c.exhibits ?? []).map((e) => clean(e.key_insight)).filter(Boolean),
  ].slice(0, 7);
  return { kind: "synthesis", caseId: c.id, title: c.title, prompt: clean(c.prompt), findings, model: c.synthesis };
}
