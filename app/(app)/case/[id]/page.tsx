import { notFound } from "next/navigation";
import { getCase, similarCases } from "@/lib/cases";
import { CaseView } from "@/components/CaseView";
import { frameworksForCase } from "@/lib/frameworks";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: getCase(id)?.title ?? "Case" };
}

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getCase(id);
  if (!c) notFound();
  return <CaseView c={c} similar={similarCases(id)} frameworks={frameworksForCase(id)} />;
}
