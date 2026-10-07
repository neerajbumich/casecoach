import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { authMode, isAllowedEmail, roleOf } from "@/lib/auth-config";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = { email: string; mode: "supabase" | "dev-open"; role: "owner" | "partner" };

// Returns the signed-in, allow-listed user, or null.
export async function getUser(): Promise<SessionUser | null> {
  // Always render per request: pages with case content must never be prerendered into static files.
  await connection();
  const mode = authMode();
  if (mode === "dev-open") return { email: process.env.DEV_EMAIL ?? "dev@localhost", mode, role: process.env.DEV_ROLE === "partner" ? "partner" : "owner" };
  if (mode !== "supabase") return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const email = (data?.claims?.email as string | undefined) ?? null;
  if (error || !isAllowedEmail(email)) return null;
  return { email: email!.toLowerCase(), mode, role: roleOf(email!) };
}

// Use at the top of every page/layout that shows case content.
export async function requireUser(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect(authMode() === "misconfigured" ? "/login?error=config" : "/login");
  return user;
}
