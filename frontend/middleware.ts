import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/admin", "/dashboard", "/devenir-vendeur", "/profil", "/verification", "/verification-carte"];
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
      .select("role, student_id_url")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? "ACHETEUR";
    const isAdmin = role === "ADMIN";

    if (isAuthPage && pathname !== "/devenir-vendeur") {
      const destination = request.nextUrl.clone();
      destination.pathname = isAdmin ? "/admin" : role === "VENDEUR" ? "/dashboard" : "/products";
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

    // Garde-fou : un futur vendeur (ACHETEUR) doit avoir SOUMIS sa carte d'étudiant
    // avant de choisir un palier. On vérifie la soumission, jamais l'approbation :
    // aucune vérification ne bloque l'accès. Les vendeurs existants (renouvellement)
    // et les admins ne sont pas concernés.
    const isBecomingVendor = pathname === "/devenir-vendeur" || pathname.startsWith("/devenir-vendeur/");
    if (isBecomingVendor && role === "ACHETEUR" && !profile?.student_id_url) {
      const destination = request.nextUrl.clone();
      destination.pathname = "/verification-carte";
      destination.search = "";
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
    "/verification-carte/:path*",
    "/login",
    "/register",
  ],
};