// Auth configuration shared by proxy.ts, server components and route handlers.
// The app FAILS CLOSED: in production, if Supabase isn't configured, nothing is served.

export type AuthMode = "supabase" | "dev-open" | "misconfigured";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function authMode(): AuthMode {
  if (SUPABASE_URL && SUPABASE_KEY) return "supabase";
  // Local preview only: never honoured on Vercel, so a deployed app can't be left open by mistake.
  if (process.env.AUTH_DEV_BYPASS === "true" && !process.env.VERCEL) return "dev-open";
  return "misconfigured";
}

const list = (v: string | undefined) =>
  (v ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

/** The owner(s): full access. */
export function ownerEmails(): string[] {
  return list(process.env.ALLOWED_EMAILS);
}
/** Invited casing partners: can use the library, drills and interviewer mode; their data is their own. */
export function partnerEmails(): string[] {
  return list(process.env.PARTNER_EMAILS).filter((e) => !ownerEmails().includes(e));
}
export function allowedEmails(): string[] {
  return [...ownerEmails(), ...partnerEmails()];
}

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return allowedEmails().includes(email.trim().toLowerCase());
}
export function roleOf(email: string): "owner" | "partner" {
  return ownerEmails().includes(email.trim().toLowerCase()) ? "owner" : "partner";
}

// Paths reachable without signing in. Nothing here may contain case content.
export const PUBLIC_PATHS = ["/login", "/offline", "/manifest.webmanifest", "/sw.js", "/icons/", "/favicon.ico", "/robots.txt", "/icon.png", "/auth/callback"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => (p.endsWith("/") ? pathname.startsWith(p) : pathname === p));
}
