import Link from "next/link";
import { MentalMath } from "@/components/MentalMath";

export const metadata = { title: "Mental math" };

export default function MathPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <nav aria-label="Breadcrumb" className="text-sm text-muted"><Link href="/practice" className="hover:underline">Practice</Link> / Mental math</nav>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Mental math</h1>
        <p className="text-sm text-ink-2">Timed case-style arithmetic: percentages, breakevens, growth, big numbers. Results track by problem type so you can focus on your weakest.</p>
      </header>
      <MentalMath />
    </div>
  );
}
