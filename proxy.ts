import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL, authMode, isAllowedEmail, isPublicPath } from "@/lib/auth-config";

// Gate for every request. Pages and data routes also re-check auth themselves (defense in depth).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const mode = authMode();
  const isApi = pathname.startsWith("/api/");

  if (isPublicPath(pathname)) return NextResponse.next();
  if (mode === "dev-open") return NextResponse.next();

  const deny = (status: number, reason: string) => {
    if (isApi) return NextResponse.json({ error: reason }, { status });
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = status === 503 ? "?error=config" : "";
    return NextResponse.redirect(url);
  };

  if (mode === "misconfigured") return deny(503, "Auth is not configured");

  // Refresh the Supabase session cookie and verify the JWT (getClaims checks the signature).
  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;
  if (!email) return deny(401, "Not signed in");
  if (!isAllowedEmail(email)) return deny(403, "This account is not on the invite list");

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
