import Link from "next/link";
import { notFound } from "next/navigation";
import { SizingDrill } from "@/components/SizingDrill";
import { getSizing, listSizing } from "@/lib/sizing";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: getSizing(id) ? "Market sizing drill" : "Market sizing" };
}

export default async function SizingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getSizing(id);
  if (!p) notFound();
  const all = listSizing();
  const next = all[(all.findIndex((x) => x.id === id) + 1) % all.length];
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <nav aria-label="Breadcrumb" className="text-sm text-muted"><Link href="/practice/sizing" className="hover:underline">Market sizing</Link> / Drill</nav>
      <SizingDrill key={p.id} p={p} nextHref={`/practice/sizing/${next.id}`} />
    </div>
  );
}
