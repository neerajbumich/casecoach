"use client";
import Link from "next/link";
import { useState } from "react";

export function FeedbackImport({ id, imported }: { id: string; imported: boolean }) {
  const [state, setState] = useState<{ done: boolean; session?: string; error?: string }>({ done: imported });
  if (state.done)
    return state.session ? <Link href={`/sessions/${state.session}`} className="text-sm underline">✓ Added: view session</Link> : <span className="text-sm text-muted">✓ In your journal</span>;
  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        className="min-h-9 rounded-lg bg-accent px-3 text-sm font-semibold text-accent-ink"
        onClick={async () => {
          const res = await fetch(`/api/feedback/${id}/import`, { method: "POST" });
          const j = await res.json().catch(() => ({}));
          setState(res.ok ? { done: true, session: j.session_id } : { done: false, error: j.error ?? "Couldn't add" });
        }}
      >
        Add to my journal
      </button>
      {state.error && <span className="text-sm text-warn">{state.error}</span>}
    </span>
  );
}
