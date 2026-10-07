// Visual issue tree: root on top, one card per branch (columns on wide screens), sub-points nested inside.
type Node = { label: string; children?: Node[] };

function Sub({ n, depth }: { n: Node; depth: number }) {
  return (
    <li className={depth > 0 ? "relative pl-3 before:absolute before:left-0 before:top-[0.6em] before:h-1 before:w-1 before:rounded-full before:bg-muted" : ""}>
      <span className={depth === 0 ? "font-medium" : "text-ink-2"}>{n.label}</span>
      {n.children?.length ? (
        <ul className="mt-1 space-y-1 border-l border-line pl-3">
          {n.children.map((c, i) => (
            <Sub key={i} n={c} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function FrameworkTree({ tree }: { tree: Node }) {
  const branches = tree.children ?? [];
  return (
    <figure aria-label={`Issue tree: ${tree.label}`} className="space-y-3">
      <div className="mx-auto w-fit rounded-lg bg-accent px-4 py-2 text-center font-semibold text-accent-ink">{tree.label}</div>
      <div aria-hidden className="mx-auto h-3 w-px bg-line" />
      <ol className={`grid gap-3 ${branches.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : branches.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {branches.map((b, i) => (
          <li key={i} className="rounded-lg border border-line bg-surface p-3">
            <p className="text-sm font-semibold">
              <span className="mr-1.5 inline-grid h-5 w-5 place-items-center rounded-full bg-chip text-xs tabular-nums">{i + 1}</span>
              {b.label}
            </p>
            {b.children?.length ? (
              <ul className="mt-2 space-y-1 text-sm">
                {b.children.map((c, j) => (
                  <Sub key={j} n={c} depth={1} />
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>
    </figure>
  );
}
