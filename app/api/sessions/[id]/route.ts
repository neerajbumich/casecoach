import { requireApiUser } from "@/lib/api";
import { getStore } from "@/lib/store";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { deny } = await requireApiUser();
  if (deny) return deny;
  const { id } = await params;
  await getStore().deleteSession(id);
  return Response.json({ ok: true });
}
