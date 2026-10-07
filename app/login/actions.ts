"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authMode, isAllowedEmail } from "@/lib/auth-config";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { message?: string; error?: string; email?: string };

// Two ways in:
//  1. Email + password (best for the iPhone home-screen app).
//  2. Email a one-time sign-in link (works with Supabase's default email; use it the first time,
//     then set a password in Settings). Links open in the browser they're clicked in, so request
//     and click the link on the same device.

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function signInWithPassword(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (authMode() !== "supabase") return { error: "Sign-in isn't configured yet.", email };
  if (!isAllowedEmail(email)) return { error: "Email or password is incorrect.", email };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email or password is incorrect. No password yet? Use the sign-in link below.", email };
  redirect("/");
}

export async function sendLink(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (authMode() !== "supabase") return { error: "Sign-in isn't configured yet.", email };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email.", email };
  // Same answer whether or not the email is invited, so the page never reveals the list.
  if (isAllowedEmail(email)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: `${await origin()}/auth/callback?next=/settings` },
    });
    if (error) return { error: `Couldn't send the link: ${error.message}`, email };
  }
  return { message: `If ${email} is invited, a sign-in link is on its way. Open it on this device.`, email };
}

export async function setPassword(_prev: LoginState, form: FormData): Promise<LoginState> {
  const password = String(form.get("password") ?? "");
  if (password.length < 10) return { error: "Use at least 10 characters." };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!isAllowedEmail(data?.claims?.email as string | undefined)) return { error: "Not signed in." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { message: "Password saved. Use it to sign in on your iPhone." };
}

export async function signOut() {
  if (authMode() === "supabase") {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
