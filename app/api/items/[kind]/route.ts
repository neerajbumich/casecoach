import { bad, requireApiUser } from "@/lib/api";
import { getStore, ITEM_KINDS, type ItemKind } from "@/lib/store";

// Small per-user records: drill results, flashcard state, fit stories. RLS keeps them private.
const kindOf = (k: string) => (ITEM_KINDS as readonly string[]).includes(k) ? (k as ItemKind) : null;
const MAX_BYTES = 40_000;

export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { deny } = await requireApiUser();
  if (deny) return deny;
  const kind = kindOf((await params).kind);
  if (!kind) return bad("Unknown kind", 404);
  return Response.json(await getStore().listItems(kind));
}

// Body: { key, data } or { items: [{ key, data }] } (batch, max 200)
export async function POST(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { deny } = await requireApiUser();
  if (deny) return deny;
  const kind = kindOf((await params).kind);
  if (!kind) return bad("Unknown kind", 404);
  const b = await req.json().catch(() => null);
  const items: { key: unknown; data: unknown }[] = Array.isArray(b?.items) ? b.items : b ? [b] : [];
  if (!items.length || items.length > 200) return bad("Send 1-200 items");
  for (const it of items) {
    if (typeof it.key !== "string" || !/^[\w.:-]{1,120}$/.test(it.key)) return bad("Invalid key");
    if (JSON.stringify(it.data ?? null).length > MAX_BYTES) return bad("Item too large");
  }
  const store = getStore();
  for (const it of items) await store.putItem(kind, it.key as string, it.data ?? {});
  return Response.json({ ok: true, saved: items.length });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { deny } = await requireApiUser();
  if (deny) return deny;
  const kind = kindOf((await params).kind);
  if (!kind) return bad("Unknown kind", 404);
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!key) return bad("Missing key");
  await getStore().deleteItem(kind, key);
  return Response.json({ ok: true });
}
