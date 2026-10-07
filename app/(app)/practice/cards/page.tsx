import Link from "next/link";
import { Flashcards } from "@/components/Flashcards";
import { buildDeck, DECKS } from "@/lib/flashcards";

export const metadata = { title: "Flashcards" };

export default function CardsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <nav aria-label="Breadcrumb" className="text-sm text-muted"><Link href="/practice" className="hover:underline">Practice</Link> / Flashcards</nav>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Flashcards</h1>
        <p className="text-sm text-ink-2">Spaced repetition: a few minutes a day keeps formulas, frameworks and industry metrics at your fingertips.</p>
      </header>
      <Flashcards cards={buildDeck()} decks={DECKS} />
    </div>
  );
}
