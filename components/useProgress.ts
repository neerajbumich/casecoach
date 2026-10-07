"use client";
import { useEffect, useSyncExternalStore } from "react";

// "Solved" status: cached on the device (works offline) and synced to Supabase via /api/progress,
// so the Mac and iPhone agree. Saving a practice session also marks its case solved on the server.
type Progress = Record<string, { solved: boolean; at: string }>;
const KEY = "cc-progress-v1";
const listeners = new Set<() => void>();
let cache: Progress | null = null;
let synced = false;

function read(): Progress {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    cache = {};
  }
  return cache!;
}

function write(p: Progress) {
  cache = p;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
  listeners.forEach((l) => l());
}

// First load on a device: upload anything solved locally, then adopt the server's view.
async function syncOnce() {
  if (synced) return;
  synced = true;
  try {
    const local = read();
    const merge = Object.fromEntries(Object.entries(local).filter(([, v]) => v.solved).map(([k, v]) => [k, v.at]));
    const res = await fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ merge }) });
    if (!res.ok) return;
    const server = (await res.json()) as Record<string, string>;
    write(Object.fromEntries(Object.entries(server).map(([k, at]) => [k, { solved: true, at }])));
  } catch {
    synced = false; // offline: try again next time
  }
}

const EMPTY: Progress = {};

export function useProgress() {
  const progress = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      const onStorage = (e: StorageEvent) => {
        if (e.key === KEY) {
          cache = null;
          l();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(l);
        window.removeEventListener("storage", onStorage);
      };
    },
    read,
    () => EMPTY,
  );
  useEffect(() => {
    syncOnce();
  }, []);
  const setSolved = (id: string, solved: boolean) => {
    const next = { ...read() };
    if (solved) next[id] = { solved: true, at: new Date().toISOString() };
    else delete next[id];
    write(next);
    fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ case_id: id, solved }) }).catch(() => {});
  };
  return { progress, isSolved: (id: string) => !!progress[id]?.solved, setSolved };
}
