import "server-only";
import { getUser } from "@/lib/auth";

// Helpers for route handlers: every data route re-checks the signed-in, allow-listed user.
export async function requireApiUser() {
  const user = await getUser();
  if (!user) return { user: null, deny: Response.json({ error: "Not signed in" }, { status: 401 }) } as const;
  return { user, deny: null } as const;
}

export function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
