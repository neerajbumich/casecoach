import Link from "next/link";
import { DRILLS, MODULES, modulesForWeakness, type DrillKind } from "@/lib/communication";
import { DIMENSIONS, averageScores } from "@/lib/scoring";
import { getStore } from "@/lib/store";

export const metadata = { title: "Communication" };
const card = "rounded-xl border border-line bg-surface p-4";

export default async function CommunicationPage() {
  const sessions = await getStore().listSessions().catch(() => []);
  const avg = averageScores(sessions);
  const focus = modulesForWeakness(avg);
  const weakest = Object.entries(avg)
    .filter((e): e is [string, number] => typeof e[1] === "number")
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([k, v]) => `${DIMENSIONS.find((d) => d.key === k)?.label} (${v}/5)`);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/learn" className="hover:underline">Learn</Link> / Communication
      </nav>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Communication</h1>
        <p className="text-sm text-ink-2">Good analysis delivered badly scores like weak analysis. These are the moments that matter and how to handle each one.</p>
      </header>

      <section aria-labelledby="h-focus" className={card}>
        <h2 id="h-focus" className="font-semibold">Your focus</h2>
        {focus.length ? (
          <>
            <p className="mt-1 text-sm text-ink-2">From your last {Math.min(10, sessions.length)} scored sessions, your weakest areas are {weakest.join(" and ")}. Start here:</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {focus.map((m) => (
                <li key={m.id}><Link href={`/communication/${m.id}`} className="inline-flex min-h-9 items-center rounded-full bg-chip px-3 text-sm hover:bg-surface-2">{m.title}</Link></li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-1 text-sm text-ink-2">Save a scored practice session and this will point you to the modules that fix your weakest areas. Until then, start with <Link href="/communication/structure" className="underline">presenting your structure</Link> and <Link href="/communication/synthesis" className="underline">the final recommendation</Link>.</p>
        )}
      </section>

      <section aria-labelledby="h-drills">
        <h2 id="h-drills" className="mb-2 font-semibold">Timed drills</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(DRILLS) as DrillKind[]).map((k) => (
            <li key={k}>
              <Link href={`/communication/drill/${k}`} className="flex h-full flex-col rounded-xl border border-line bg-surface p-4 hover:bg-surface-2">
                <span className="font-semibold">{DRILLS[k].title}</span>
                <span className="mt-1 text-sm text-ink-2">{DRILLS[k].blurb}</span>
                <span className="mt-auto pt-3 text-xs text-muted">{DRILLS[k].prepSec}s to think · {DRILLS[k].speakSec}s to speak</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="h-mods">
        <h2 id="h-mods" className="mb-2 font-semibold">The moments, in case order</h2>
        <ol className="space-y-2">
          {MODULES.map((m, i) => (
            <li key={m.id}>
              <Link href={`/communication/${m.id}`} className="flex gap-3 rounded-xl border border-line bg-surface p-4 hover:bg-surface-2">
                <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-chip text-sm font-semibold tabular-nums">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block font-semibold">{m.title}</span>
                  <span className="block text-xs text-muted">{m.moment}</span>
                  <span className="mt-1 block text-sm text-ink-2">{m.principle}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
