import Link from "next/link";
import { FrameworkCoach } from "@/components/FrameworkCoach";
import { llmEnabled } from "@/lib/llm-config";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Framework coach" };

export default async function CoachPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/frameworks" className="hover:underline">Frameworks</Link> / Coach
      </nav>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Build a custom framework</h1>
        <p className="text-sm text-ink-2">Get a structure tailored to a new case, or draft your own and have it critiqued on MECE, tailoring, hypothesis and prioritisation.</p>
      </header>
      <FrameworkCoach ai={llmEnabled()} />
    </div>
  );
}
