import Link from "next/link";
import { AnchorTable } from "@/components/AnchorTable";
import { listAnchors } from "@/lib/us";

export const metadata = { title: "US sizing anchors" };

export default function AnchorsPage() {
  const anchors = listAnchors();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <nav aria-label="Breadcrumb" className="text-sm text-muted"><Link href="/us" className="hover:underline">US Playbook</Link> / Numbers to know</nav>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">US sizing anchors</h1>
        <p className="text-sm text-ink-2">{anchors.length} numbers interviewers expect you to estimate with. The bold figure is the round number to use in a case; the line below shows the verified value, year and source. All are also in Flashcards.</p>
      </header>
      <AnchorTable anchors={anchors} />
    </div>
  );
}
