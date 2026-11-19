import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminSignup } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  const code = url.searchParams.get("code");
  const isGoogleOAuth = url.searchParams.get("oauth") === "google";
  url.pathname = "/verification-carte";
  url.search = isGoogleOAuth ? "?oauth=google" : "";
  const response = NextResponse.redirect(url);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!code || !supabaseUrl || !supabaseAnonKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("error", "oauth_callback");
    return NextResponse.redirect(loginUrl);
  }
  // Inscription administrateur : pas de carte d'étudiant à demander.
  if (isAdminSignup(data.user?.user_metadata)) {
    const accountUrl = request.nextUrl.clone();
    accountUrl.pathname = "/compte-admin";
    accountUrl.search = "";
    response.headers.set("Location", accountUrl.toString());
  }
  return response;
}
