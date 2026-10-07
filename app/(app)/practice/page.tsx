import { getIndex } from "@/lib/cases";
import { getStore } from "@/lib/store";
import { recommendNext } from "@/lib/recommend";
import { PracticeHub } from "@/components/PracticeHub";
import { llmEnabled } from "@/lib/llm-config";
import { FIRM_MODES, type FirmMode } from "@/lib/scoring";
import { dueCards } from "@/lib/training";
import type { SrsState } from "@/lib/training-types";

export const metadata = { title: "Practice" };

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ firm?: string }> }) {
  const { firm } = await searchParams;
  const store = getStore();
  const [sessions, progress, srs] = await Promise.all([store.listSessions(), store.getProgress(), store.listItems<SrsState>("srs").catch(() => [])]);
  const rec = recommendNext(sessions, new Set(Object.keys(progress)));
  return (
    <PracticeHub
      index={getIndex()}
      recent={sessions.slice(0, 5).map((s) => ({ id: s.id, title: s.case_title, overall: s.overall, at: s.started_at, firm: s.firm_mode }))}
      recommendation={rec && { id: rec.caseEntry.id, title: rec.caseEntry.title, label: rec.label, avg: rec.avg, why: rec.why }}
      llmEnabled={llmEnabled()}
      initialFirm={FIRM_MODES.some((f) => f.key === firm) ? (firm as FirmMode) : undefined}
      due={dueCards(srs)}
    />
  );
}
