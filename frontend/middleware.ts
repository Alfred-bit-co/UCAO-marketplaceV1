import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/admin", "/dashboard", "/devenir-vendeur", "/profil", "/verification"];
const AUTH_PAGES = ["/login", "/register", "/devenir-vendeur"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isVerificationPage = pathname.startsWith("/verification");
  const isAuthPage = AUTH_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`));

  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, verification_status")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? "ACHETEUR";
    const verificationStatus = profile?.verification_status ?? "pending";
    const isAdmin = role === "ADMIN";
    const isVerified = isAdmin || verificationStatus === "approved";

    if (isAuthPage && pathname !== "/devenir-vendeur") {
      const destination = request.nextUrl.clone();
      destination.pathname = isAdmin ? "/admin" : isVerified ? (role === "VENDEUR" ? "/dashboard" : "/products") : "/verification";
      destination.search = "";
      return NextResponse.redirect(destination);
    }

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      const destination = request.nextUrl.clone();
      destination.pathname = "/";
      return NextResponse.redirect(destination);
    }

    if (pathname.startsWith("/dashboard") && role !== "VENDEUR" && !isAdmin) {
      const destination = request.nextUrl.clone();
      destination.pathname = role === "ACHETEUR" ? "/devenir-vendeur" : "/profil";
      return NextResponse.redirect(destination);
    }

    if (!isVerified && isProtected && !isVerificationPage) {
      const destination = request.nextUrl.clone();
      destination.pathname = "/verification";
      return NextResponse.redirect(destination);
    }

    if (isVerified && isVerificationPage) {
      const destination = request.nextUrl.clone();
      destination.pathname = role === "ADMIN" ? "/admin" : role === "VENDEUR" ? "/dashboard" : "/profil";
      return NextResponse.redirect(destination);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/devenir-vendeur/:path*",
    "/profil/:path*",
    "/verification/:path*",
    "/login",
    "/register",
  ],
};
