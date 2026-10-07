import { NextResponse } from "next/server";
import { isAllowedEmail } from "@/lib/auth-config";
import { createClient } from "@/lib/supabase/server";

// Landing page for the emailed sign-in link. Exchanges the one-time code for a session cookie.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const next = url.searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const supabase = await createClient();

  let ok = false;
  // Supabase sends ?error_description=… when the link itself was rejected (expired, already used).
  let reason = url.searchParams.get("error_description") ?? "";
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
    if (error) reason = /verifier/i.test(error.message) ? "different-browser" : error.message;
  } else if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
    ok = !error;
    if (error) reason = error.message;
  } else if (!reason) reason = "no code in link";

  if (ok) {
    const { data } = await supabase.auth.getClaims();
    if (isAllowedEmail(data?.claims?.email as string | undefined)) return NextResponse.redirect(new URL(safeNext, url.origin));
    await supabase.auth.signOut();
    reason = "email not on the invite list";
  }
  if (reason) console.warn("[auth/callback] sign-in link failed:", reason);
  const to = new URL("/login?error=link", url.origin);
  if (reason) to.searchParams.set("reason", reason.slice(0, 120));
  return NextResponse.redirect(to);
}
