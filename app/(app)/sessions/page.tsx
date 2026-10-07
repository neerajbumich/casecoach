import Link from "next/link";
import { getStore } from "@/lib/store";
import { DIMENSIONS, FIRM_MODES } from "@/lib/scoring";

export const metadata = { title: "Session log" };

export default async function SessionsPage() {
  const sessions = await getStore().listSessions();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Session log</h1>
          <p className="text-sm text-muted">{sessions.length} mock case{sessions.length === 1 ? "" : "s"} saved</p>
        </div>
        <Link href="/practice" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">New case</Link>
      </div>
      {sessions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">No sessions yet. Run a case from Practice and save its scorecard.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs text-muted">
              <tr className="border-b border-line">
                <th scope="col" className="px-3 py-2 font-medium">Date</th>
                <th scope="col" className="px-3 py-2 font-medium">Case</th>
                <th scope="col" className="px-3 py-2 font-medium">Style</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Min</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Hints</th>
                {DIMENSIONS.map((d) => (
                  <th key={d.key} scope="col" className="px-1 py-2 text-center font-medium" title={d.label}>{d.label.split(/[ /]/)[0].slice(0, 5)}</th>
                ))}
                <th scope="col" className="px-3 py-2 text-right font-medium">Overall</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0 hover:bg-surface-2">
                  <td className="whitespace-nowrap px-3 py-2 text-muted">{new Date(s.started_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2"><Link href={`/sessions/${s.id}`} className="font-medium underline-offset-2 hover:underline">{s.case_title}</Link></td>
                  <td className="px-3 py-2 text-ink-2">{FIRM_MODES.find((f) => f.key === s.firm_mode)?.label.split(" ")[0]}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.duration_min ?? "–"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.hints_used}</td>
                  {DIMENSIONS.map((d) => (
                    <td key={d.key} className="px-1 py-2 text-center tabular-nums">{s.scores[d.key] ?? "–"}</td>
                  ))}
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{s.overall ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
