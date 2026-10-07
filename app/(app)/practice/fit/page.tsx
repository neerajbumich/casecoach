import Link from "next/link";
import { StoryBank, type FitData } from "@/components/StoryBank";
import data from "@/data/drills/fit-questions.json";

export const metadata = { title: "Fit stories" };

export default function FitPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <nav aria-label="Breadcrumb" className="text-sm text-muted"><Link href="/practice" className="hover:underline">Practice</Link> / Fit stories</nav>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Fit story bank</h1>
        <p className="text-sm text-ink-2">Write your stories once, tag what they show, spot gaps, and practice with {(data as FitData).questions.length} real fit questions. Your stories are private to you.</p>
      </header>
      <StoryBank data={data as FitData} />
    </div>
  );
}
