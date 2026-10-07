import { Suspense } from "react";
import { getIndex } from "@/lib/cases";
import { Library } from "@/components/Library";

export const metadata = { title: "Library" };

export default function LibraryPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading library…</p>}>
      <Library index={getIndex()} />
    </Suspense>
  );
}
