import { bad, requireApiUser } from "@/lib/api";
import { getCase } from "@/lib/cases";
import { getStore } from "@/lib/store";

export async function GET() {
  const { deny } = await requireApiUser();
  if (deny) return deny;
  return Response.json(await getStore().getProgress());
}

// Body: { case_id, solved } or { merge: { [case_id]: iso } } to upload this device's local progress once.
export async function POST(req: Request) {
  const { deny } = await requireApiUser();
  if (deny) return deny;
  const b = await req.json().catch(() => ({}));
  const store = getStore();
  if (b && typeof b.merge === "object" && b.merge) {
    for (const id of Object.keys(b.merge).slice(0, 5000)) if (getCase(id)) await store.setProgress(id, true);
    return Response.json(await store.getProgress());
  }
  if (!getCase(String(b.case_id))) return bad("Unknown case");
  await store.setProgress(String(b.case_id), !!b.solved);
  return Response.json({ ok: true });
}
