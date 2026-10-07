// Spaced repetition (a simplified SM-2). Pure functions so they can be tested and run in the browser.
import type { SrsState } from "@/lib/training-types";

export type Grade = 0 | 1 | 2 | 3; // Again, Hard, Good, Easy
export const GRADES: { g: Grade; label: string }[] = [
  { g: 0, label: "Again" },
  { g: 1, label: "Hard" },
  { g: 2, label: "Good" },
  { g: 3, label: "Easy" },
];

const DAY = 86_400_000;
const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export function review(prev: SrsState | undefined, g: Grade, now = Date.now()): SrsState {
  const s: SrsState = prev ? { ...prev } : { ease: 2.5, interval: 0, due: new Date(now).toISOString(), reps: 0, lapses: 0 };
  if (g === 0) {
    s.lapses += 1;
    s.reps = 0;
    s.interval = 0; // see it again this session / today
    s.ease = Math.max(1.3, s.ease - 0.2);
    s.due = new Date(now + 10 * 60_000).toISOString();
  } else {
    s.reps += 1;
    if (s.reps === 1) s.interval = g === 3 ? 4 : g === 2 ? 1 : 1;
    else if (s.reps === 2) s.interval = g === 3 ? 8 : g === 2 ? 3 : 2;
    else s.interval = Math.round(s.interval * (g === 1 ? 1.2 : g === 2 ? s.ease : s.ease * 1.3));
    s.interval = Math.min(s.interval, 180);
    s.ease = Math.max(1.3, s.ease + (g === 1 ? -0.15 : g === 3 ? 0.15 : 0));
    s.due = new Date(startOfDay(now) + s.interval * DAY).toISOString();
  }
  s.last = new Date(now).toISOString();
  return s;
}

export function isDue(s: SrsState | undefined, now = Date.now()) {
  return !s || new Date(s.due).getTime() <= now;
}

/** Due reviews first (oldest due first), then up to `newLimit` unseen cards. */
export function queue<T extends { id: string }>(cards: T[], state: Map<string, SrsState>, newLimit = 15, now = Date.now()): T[] {
  const due = cards.filter((c) => state.has(c.id) && isDue(state.get(c.id), now)).sort((a, b) => state.get(a.id)!.due.localeCompare(state.get(b.id)!.due));
  const fresh = cards.filter((c) => !state.has(c.id)).slice(0, newLimit);
  return [...due, ...fresh];
}
