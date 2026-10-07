import Link from "next/link";
import { notFound } from "next/navigation";
import { CommDrill } from "@/components/CommDrill";
import { DRILLS, type DrillKind } from "@/lib/communication";
import { drillItem } from "@/lib/drills";

export async function generateMetadata({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  return { title: DRILLS[kind as DrillKind]?.title ?? "Drill" };
}

export default async function DrillPage({ params, searchParams }: { params: Promise<{ kind: string }>; searchParams: Promise<{ case?: string }> }) {
  const { kind } = await params;
  const { case: caseId } = await searchParams;
  if (!(kind in DRILLS)) notFound();
  const k = kind as DrillKind;
  const item = drillItem(k, caseId);
  if (!item) notFound();
  const seed = Math.random().toString(36).slice(2, 8);
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/communication" className="hover:underline">Communication</Link> / Drill
      </nav>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{DRILLS[k].title}</h1>
        <p className="text-sm text-ink-2">{DRILLS[k].blurb}</p>
      </header>
      <CommDrill key={`${item.caseId}-${seed}`} item={item} cfg={DRILLS[k]} nextHref={`/communication/drill/${k}?n=${seed}`} />
    </div>
  );
}
