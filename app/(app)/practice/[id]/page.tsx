import { notFound } from "next/navigation";
import { getCase } from "@/lib/cases";
import { interviewerPrompt } from "@/lib/interviewer";
import { llmEnabled } from "@/lib/llm-config";
import { FIRM_MODES, type FirmMode } from "@/lib/scoring";
import { PracticeConsole } from "@/components/PracticeConsole";

export const metadata = { title: "Practice" };

type SP = { firm?: string; fit?: string; min?: string; voice?: string };

export default async function PracticeCase({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const { id } = await params;
  const sp = await searchParams;
  const c = getCase(id);
  if (!c) notFound();
  const firm = (FIRM_MODES.some((f) => f.key === sp.firm) ? sp.firm : c.format === "interviewer-led" ? "mckinsey" : "bain") as FirmMode;
  const opts = { firm, fit: sp.fit === "1", minutes: Math.min(60, Math.max(10, Number(sp.min) || 30)), voice: sp.voice !== "0" };
  return (
    <PracticeConsole
      caseId={c.id}
      title={c.title}
      meta={`${c.school} ${c.edition} · ${c.case_type.join(", ")}`}
      opts={opts}
      prompt={interviewerPrompt(c, opts)}
      // Only titles and images: no insights or answers leak into the candidate view.
      exhibits={c.exhibits.map((e) => ({ id: e.id, title: e.title, image: e.image_path && !e.image_has_answers ? `/api/${e.image_path}` : null, data: e.data ?? null }))}
      llmEnabled={llmEnabled()}
    />
  );
}
