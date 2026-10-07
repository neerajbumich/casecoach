"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type Item<T> = { key: string; data: T; updated_at: string };

// Loads a kind of per-user item from the server and saves changes optimistically.
// Falls back to in-memory only if the server is unreachable (e.g. offline), and says so.
export function useItems<T>(kind: "drill" | "srs" | "story") {
  const [items, setItems] = useState<Item<T>[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    fetch(`/api/items/${kind}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: Item<T>[]) => alive.current && setItems(d))
      .catch(() => {
        if (!alive.current) return;
        setItems([]);
        setError("Couldn't load your saved data (offline?). Changes won't be saved until you're back online.");
      });
    return () => {
      alive.current = false;
    };
  }, [kind]);

  const putMany = useCallback(
    async (rows: { key: string; data: T }[]) => {
      if (!rows.length) return;
      const now = new Date().toISOString();
      setItems((cur) => {
        const map = new Map((cur ?? []).map((i) => [i.key, i]));
        for (const r of rows) map.set(r.key, { key: r.key, data: r.data, updated_at: now });
        return [...map.values()];
      });
      try {
        for (let i = 0; i < rows.length; i += 200) {
          const res = await fetch(`/api/items/${kind}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: rows.slice(i, i + 200) }) });
          if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
        }
        setError(null);
      } catch (e) {
        setError(`Couldn't save: ${(e as Error).message}`);
      }
    },
    [kind],
  );
  const put = useCallback((key: string, data: T) => putMany([{ key, data }]), [putMany]);

  const remove = useCallback(
    async (key: string) => {
      setItems((cur) => (cur ?? []).filter((i) => i.key !== key));
      const res = await fetch(`/api/items/${kind}?key=${encodeURIComponent(key)}`, { method: "DELETE" }).catch(() => null);
      if (!res?.ok) setError("Couldn't delete (offline?).");
    },
    [kind],
  );

  return { items, error, put, putMany, remove };
}

export const newKey = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
