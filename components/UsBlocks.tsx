import type { Block } from "@/lib/us";

const card = "rounded-xl border border-line bg-surface p-4";

function Table({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>{columns.map((c) => <th key={c} scope="col" className="border-b border-line px-2 py-1.5 text-left font-semibold">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="align-top odd:bg-surface-2/60">
              {r.map((v, j) => <td key={j} className={`px-2 py-1.5 ${j === 0 ? "font-medium" : "text-ink-2"}`}>{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function UsBlock({ b }: { b: Block }) {
  switch (b.type) {
    case "text":
      return (
        <section className="space-y-1">
          {b.title && <h2 className="font-semibold">{b.title}</h2>}
          <p className="leading-relaxed">{b.body}</p>
        </section>
      );
    case "list":
      return (
        <section className={card}>
          <h2 className="font-semibold">{b.title}</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">{b.items.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      );
    case "table":
      return (
        <section className={`${card} space-y-2`}>
          <h2 className="font-semibold">{b.title}</h2>
          <Table columns={b.columns} rows={b.rows} />
          {b.note && <p className="text-xs text-muted">{b.note}</p>}
        </section>
      );
    case "callout":
      return (
        <aside className={`rounded-xl border-l-4 bg-surface p-4 ${b.tone === "tip" ? "border-l-ok" : "border-l-warn"}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{b.tone === "tip" ? "Interview tip" : "Watch out"}</p>
          <p className="mt-0.5 font-semibold">{b.title}</p>
          <p className="mt-1 text-sm text-ink-2">{b.body}</p>
        </aside>
      );
    case "compare":
      return (
        <section className={`${card} space-y-2`}>
          <h2 className="font-semibold">{b.title}</h2>
          <Table columns={["", b.left || "India", b.right || "US"]} rows={b.rows} />
        </section>
      );
  }
}
