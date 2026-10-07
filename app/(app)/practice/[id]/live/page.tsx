import { notFound, redirect } from "next/navigation";
import { getCase } from "@/lib/cases";
import { llmEnabled } from "@/lib/llm-config";
import { FIRM_MODES, type FirmMode } from "@/lib/scoring";
import { LiveInterview } from "@/components/LiveInterview";

export const metadata = { title: "Live interview" };

export default async function LivePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const c = getCase(id);
  if (!c) notFound();
  if (!llmEnabled()) redirect(`/practice/${id}`);
  const firm = (FIRM_MODES.some((f) => f.key === sp.firm) ? sp.firm : "bain") as FirmMode;
  const opts = { firm, fit: sp.fit === "1", minutes: Math.min(60, Math.max(10, Number(sp.min) || 30)), voice: sp.voice !== "0" };
  return (
    <LiveInterview
      caseId={c.id}
      title={c.title}
      opts={opts}
      exhibits={c.exhibits.map((e) => ({ id: e.id, title: e.title, image: e.image_path && !e.image_has_answers ? `/api/${e.image_path}` : null, data: e.data ?? null }))}
    />
  );
}
