import Link from "next/link";
import { notFound } from "next/navigation";
import { InterviewerMode } from "@/components/InterviewerMode";
import { getCase } from "@/lib/cases";
import { requireUser } from "@/lib/auth";
import { allowedEmails } from "@/lib/auth-config";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Interview: ${getCase(id)?.title ?? "case"}` };
}

export default async function InterviewerPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const c = getCase(id);
  if (!c) notFound();
  const candidates = allowedEmails().map((email) => ({ email, you: email === user.email }));
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/practice/partner" className="hover:underline">Casing partner</Link> / {c.title}
      </nav>
      <h1 className="text-2xl font-semibold tracking-tight">{c.title}</h1>
      <InterviewerMode c={c} candidates={candidates} me={user.email} />
    </div>
  );
}
