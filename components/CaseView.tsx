"use client";
import Link from "next/link";
import { UsContextButton } from "@/components/UsContextButton";
import { useRef } from "react";
import type { CaseRecord, Exhibit, FrameworkNode, MathStep, Stage } from "@/lib/schema/case";
import type { CaseIndexEntry } from "@/lib/cases";
import { QUANT_LABEL, label } from "@/lib/taxonomy";
import { useProgress } from "@/components/useProgress";

function Section({ title, badge, children, spoiler = false, defaultOpen = false }: { title: string; badge?: string | number; children: React.ReactNode; spoiler?: boolean; defaultOpen?: boolean }) {
  return (
    <details className="group rounded-xl border border-line bg-surface" open={defaultOpen || undefined}>
      <summary className="flex min-h-12 items-center gap-2 px-4 py-2">
        <span className="chev inline-block text-muted transition-transform" aria-hidden>›</span>
        <span className="font-semibold">{title}</span>
        {badge != null && <span className="rounded-full bg-chip px-2 text-xs tabular-nums text-ink-2">{badge}</span>}
        {spoiler && <span className="ml-auto text-xs text-muted">Contains answers</span>}
      </summary>
      <div className="border-t border-line px-4 py-3 text-[15px] leading-relaxed">{children}</div>
    </details>
  );
}

// Nested reveal for answers inside an otherwise open section.
function Reveal({ label: l, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="mt-2 rounded-lg bg-surface-2">
      <summary className="flex min-h-10 items-center gap-2 px-3 text-sm font-medium text-ink-2">
        <span className="chev inline-block transition-transform" aria-hidden>›</span>
        {l}
      </summary>
      <div className="px-3 pb-3 text-sm leading-relaxed">{children}</div>
    </details>
  );
}

function Tree({ node, depth = 0 }: { node: FrameworkNode; depth?: number }) {
  return (
    <li className={depth ? "relative pl-4 before:absolute before:left-0 before:top-0 before:h-full before:border-l before:border-line" : ""}>
      <span className={`inline-block rounded-md px-2 py-0.5 ${depth === 0 ? "bg-accent font-semibold text-accent-ink" : depth === 1 ? "bg-chip font-medium" : "text-ink-2"}`}>{node.label}</span>
      {node.children && node.children.length > 0 && (
        <ul className="mt-1 space-y-1 pl-2">
          {node.children.map((c, i) => (
            <Tree key={i} node={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

function List({ items }: { items: string[] }) {
  if (!items?.length) return <p className="text-sm text-muted">Not provided in the book.</p>;
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  );
}

function DataTable({ data }: { data: NonNullable<Exhibit["data"]> }) {
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            {data.columns.map((c, i) => (
              <th key={i} scope="col" className="border-b border-line px-2 py-1 text-left font-semibold whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r, i) => (
            <tr key={i} className="odd:bg-surface-2/60">
              {r.map((v, j) => (
                <td key={j} className={`px-2 py-1 align-top ${typeof v === "number" ? "text-right tabular-nums" : ""}`}>{v ?? ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExhibitCard({ e }: { e: Exhibit }) {
  return (
    <figure id={`ex-${e.id}`} className="rounded-lg border border-line p-3">
      <figcaption className="text-sm font-semibold">
        {e.title} <span className="font-normal text-muted">· p.{e.page}</span>
      </figcaption>
      {e.image_path && !e.image_has_answers && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/${e.image_path}`} alt={`${e.title}: ${e.description}`} loading="lazy" decoding="async" className="mt-2 h-auto w-full rounded-md border border-line bg-white" />
      )}
      {e.image_path && e.image_has_answers && (
        <Reveal label="Source page (also shows interviewer notes)">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/${e.image_path}`} alt={`${e.title}: source page`} loading="lazy" decoding="async" className="h-auto w-full rounded-md border border-line bg-white" />
        </Reveal>
      )}
      <p className="mt-2 text-sm text-ink-2">{e.description}</p>
      {e.data && (
        <Reveal label={`Data as a table${e.data_confidence !== "high" ? ` (transcription ${e.data_confidence} confidence)` : ""}`}>
          <DataTable data={e.data} />
        </Reveal>
      )}
      <Reveal label="What to notice">{e.key_insight}</Reveal>
    </figure>
  );
}

function StageCard({ s }: { s: Stage }) {
  return (
    <li className="rounded-lg border border-line p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        Step {s.order} · {s.kind.replace("-", " ")}
      </p>
      <p className="mt-1">{s.interviewer_asks}</p>
      {s.exhibit_ids?.length ? (
        <p className="mt-1 text-sm text-ink-2">
          Uses{" "}
          {s.exhibit_ids.map((x, i) => (
            <a key={x} href={`#ex-${x}`} className="underline underline-offset-2">
              {i ? ", " : ""}
              {x}
            </a>
          ))}
        </p>
      ) : null}
      {(s.info_to_release || s.release_when) && (
        <Reveal label="Information the interviewer holds">
          {s.release_when && <p><span className="font-medium">Release when:</span> {s.release_when}</p>}
          {s.info_to_release && <p className="mt-1">{s.info_to_release}</p>}
        </Reveal>
      )}
      <Reveal label="Expected answer">
        <p>{s.expected_answer}</p>
        {s.good_answer_signals?.length ? (
          <>
            <p className="mt-2 font-medium">Signals of a strong answer</p>
            <List items={s.good_answer_signals} />
          </>
        ) : null}
      </Reveal>
    </li>
  );
}

function MathCard({ m }: { m: MathStep }) {
  return (
    <li className="rounded-lg border border-line p-3">
      <p className="font-medium">{m.question}</p>
      {m.givens.length > 0 && (
        <ul className="mt-1 list-disc pl-5 text-sm text-ink-2">
          {m.givens.map((g, i) => (
            <li key={i}>{g}</li>
          ))}
        </ul>
      )}
      <Reveal label="Show solution">
        <ol className="list-decimal space-y-1 pl-5">
          {m.steps.map((s, i) => (
            <li key={i} className="tabular-nums">{s}</li>
          ))}
        </ol>
        <p className="mt-2 rounded-md bg-surface px-2 py-1 font-semibold">Answer: {m.answer}</p>
        {!m.verified && (
          <p className="mt-2 text-warn">
            <span className="font-semibold">⚠ Differs from the book.</span> {m.book_answer_if_different ?? "Our recomputation doesn't match the book's figure."}
          </p>
        )}
      </Reveal>
    </li>
  );
}

export function CaseView({ c, similar, frameworks = [] }: { c: CaseRecord; similar: CaseIndexEntry[]; frameworks?: { id: string; name: string }[] }) {
  const { isSolved, setSolved } = useProgress();
  const root = useRef<HTMLDivElement>(null);
  const solved = isSolved(c.id);
  const inferred = new Set(c.extraction.fields_inferred);
  const setAll = (open: boolean) => root.current?.querySelectorAll("details").forEach((d) => (d.open = open));
  const fmt = c.format === "interviewer-led" ? "Interviewer-led" : c.format === "candidate-led" ? "Candidate-led" : "Format not stated";

  return (
    <article ref={root} className="mx-auto max-w-3xl space-y-3">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/library" className="underline-offset-2 hover:underline">Library</Link> / {c.school} {c.edition}
      </nav>

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{c.title}</h1>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {c.case_type.map((t) => (
            <Link prefetch={false} key={t} href={`/library?type=${encodeURIComponent(t)}`} className="rounded-md bg-chip px-2 py-1 hover:underline">{t}</Link>
          ))}
          <Link prefetch={false} href={`/library?industry=${c.industry}`} className="rounded-md bg-chip px-2 py-1 hover:underline">
            {label(c.industry)}{c.sub_industry ? ` · ${label(c.sub_industry)}` : ""}
          </Link>
          <span className="rounded-md bg-chip px-2 py-1">{fmt}</span>
          <span className="rounded-md bg-chip px-2 py-1" title={c.difficulty_inferred ? "Inferred" : c.difficulty_source_label}>
            Difficulty {c.difficulty}/5{c.difficulty_inferred ? " (est.)" : ""}
          </span>
          <span className="rounded-md bg-chip px-2 py-1">Quant {QUANT_LABEL[c.quant_intensity]}</span>
          <span className="rounded-md bg-chip px-2 py-1">~{c.estimated_minutes} min</span>
          {c.firm_style_hint?.map((f) => (
            <span key={f} className="rounded-md bg-chip px-2 py-1">{f}</span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setSolved(c.id, !solved)}
            aria-pressed={solved}
            className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${solved ? "bg-chip text-ok" : "bg-accent text-accent-ink"}`}
          >
            {solved ? "✓ Solved" : "Mark as solved"}
          </button>
          <Link href={`/practice/${c.id}`} className="inline-flex min-h-10 items-center rounded-lg border border-accent px-4 text-sm font-semibold">Practice this case</Link>
          <UsContextButton title={c.title} prompt={c.prompt} clarifying={c.clarifying_info.map((q) => `${q.question_topic}: ${q.answer}`)} industry={label(c.industry)} />
          <button onClick={() => setAll(true)} className="min-h-10 rounded-lg border border-line px-3 text-sm">Expand all</button>
          <button onClick={() => setAll(false)} className="min-h-10 rounded-lg border border-line px-3 text-sm">Collapse all</button>
        </div>
      </header>

      <section className="rounded-xl border border-line bg-surface p-4" aria-labelledby="h-prompt">
        <h2 id="h-prompt" className="text-xs font-semibold uppercase tracking-wide text-muted">Prompt</h2>
        <p className="mt-1 whitespace-pre-line text-[16px] leading-relaxed">{c.prompt}</p>
        {c.fit_question && <Reveal label="Paired fit question">{c.fit_question}</Reveal>}
      </section>

      <Section title="Clarifying information" badge={c.clarifying_info.length}>
        {c.clarifying_info.length ? (
          <dl className="space-y-2">
            {c.clarifying_info.map((q, i) => (
              <div key={i}>
                <dt className="font-medium">{q.question_topic}</dt>
                <dd className="text-ink-2">{q.answer}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-muted">The book gives no separate clarifying info for this case.</p>
        )}
      </Section>

      <Section title="Suggested framework" spoiler>
        {inferred.has("suggested_framework") && <p className="mb-2 text-xs text-muted">Not in the book. AI-suggested structure.</p>}
        <p className="mb-3 text-ink-2">{c.suggested_framework.summary}</p>
        <ul className="space-y-1 text-sm">
          <Tree node={c.suggested_framework.tree} />
        </ul>
      </Section>

      <Section title="Interview flow" badge={c.stages.length} spoiler>
        <p className="mb-2 text-sm text-muted">Each step shows the interviewer&apos;s question. Open the answers only after you&apos;ve tried it.</p>
        <ol className="space-y-2">
          {c.stages.map((s) => (
            <StageCard key={s.order} s={s} />
          ))}
        </ol>
      </Section>

      {c.exhibits.length > 0 && (
        <Section title="Exhibits" badge={c.exhibits.length}>
          <div className="space-y-3">
            {c.exhibits.map((e) => (
              <ExhibitCard key={e.id} e={e} />
            ))}
          </div>
        </Section>
      )}

      {c.math.length > 0 && (
        <Section title="Math" badge={c.math.length}>
          <ol className="space-y-2">
            {c.math.map((m) => (
              <MathCard key={m.id} m={m} />
            ))}
          </ol>
        </Section>
      )}

      <Section title="Synthesis / recommendation" spoiler>
        <p className="whitespace-pre-line">{c.synthesis}</p>
      </Section>

      <Section title="What great looks like" spoiler>
        {inferred.has("what_great_looks_like") && <p className="mb-2 text-xs text-muted">Partly AI-written; not all from the book.</p>}
        <List items={c.what_great_looks_like} />
      </Section>

      <Section title="Common pitfalls">
        {inferred.has("common_pitfalls") && <p className="mb-2 text-xs text-muted">Partly AI-written; not all from the book.</p>}
        <List items={c.common_pitfalls} />
      </Section>

      <Section title="Interviewer notes" spoiler>
        <p className="whitespace-pre-line">{c.interviewer_notes || "None given."}</p>
        {c.follow_ups?.length ? (
          <>
            <p className="mt-3 font-medium">Bonus questions</p>
            <List items={c.follow_ups} />
          </>
        ) : null}
      </Section>

      <Section title="Source & data quality">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted">Source</dt>
          <dd>{c.source_file}, PDF pages {c.page_range[0]}–{c.page_range[1]}</dd>
          {c.author && (
            <>
              <dt className="text-muted">Author</dt>
              <dd>{c.author}</dd>
            </>
          )}
          <dt className="text-muted">Confidence</dt>
          <dd className="capitalize">{c.extraction.confidence}</dd>
          <dt className="text-muted">Math checked</dt>
          <dd>{c.extraction.math_verified ? "All steps match the book" : "Some steps differ from the book (see Math)"}</dd>
          {c.extraction.low_confidence_fields.length > 0 && (
            <>
              <dt className="text-muted">Uncertain</dt>
              <dd>{c.extraction.low_confidence_fields.join(", ")}</dd>
            </>
          )}
          {c.extraction.notes && (
            <>
              <dt className="text-muted">Notes</dt>
              <dd>{c.extraction.notes}</dd>
            </>
          )}
          <dt className="text-muted">Tags</dt>
          <dd>{c.tags.join(", ")}</dd>
        </dl>
      </Section>

      {frameworks.length > 0 && (
        <section aria-labelledby="h-fw" className="pt-2">
          <h2 id="h-fw" className="mb-2 text-sm font-semibold">Frameworks this case uses</h2>
          <ul className="flex flex-wrap gap-2">
            {frameworks.map((f) => (
              <li key={f.id}>
                <Link prefetch={false} href={`/frameworks/${f.id}`} className="inline-flex min-h-9 items-center rounded-full bg-chip px-3 text-sm hover:bg-surface-2">{f.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {c.industry !== "other" && (
        <p className="pt-1 text-sm">
          <Link prefetch={false} href={`/industries/${c.industry}`} className="underline">{label(c.industry)} industry primer and news →</Link>
        </p>
      )}

      {similar.length > 0 && (
        <section aria-labelledby="h-similar" className="pt-2">
          <h2 id="h-similar" className="mb-2 text-sm font-semibold">Similar cases</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {similar.map((s) => (
              <li key={s.id}>
                <Link prefetch={false} href={`/case/${s.id}`} className="block rounded-xl border border-line bg-surface p-3 hover:bg-surface-2">
                  <span className="block font-medium">{s.title}</span>
                  <span className="block text-xs text-muted">{s.case_type.join(" · ")} · {label(s.industry)} · {s.difficulty}/5</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
