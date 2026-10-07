import { Suspense } from "react";
import { getIndex } from "@/lib/cases";
import { Dashboard } from "@/components/Dashboard";
import { HomeHeadlines, NewsSkeleton } from "@/components/NewsBlocks";
import { TodayBlock } from "@/components/TodayBlock";

export const metadata = { title: "Home" };

export default function HomePage() {
  return (
    <Dashboard index={getIndex()}>
      <TodayBlock />
      <Suspense
        fallback={
          <section className="rounded-xl border border-line bg-surface p-4">
            <h2 className="mb-2 font-semibold">Recruiting radar</h2>
            <NewsSkeleton />
          </section>
        }
      >
        <HomeHeadlines />
      </Suspense>
    </Dashboard>
  );
}
