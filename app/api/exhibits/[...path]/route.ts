import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getUser } from "@/lib/auth";

// Serves copyrighted exhibit images only to signed-in, allow-listed users.
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!(await getUser())) return new Response("Unauthorized", { status: 401 });
  const { path } = await params;
  if (path.length !== 2 || !/^[a-z0-9-]+$/.test(path[0]) || !/^p\d{3}\.webp$/.test(path[1])) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const buf = await readFile(join(process.cwd(), "private", "exhibits", path[0], path[1]));
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
